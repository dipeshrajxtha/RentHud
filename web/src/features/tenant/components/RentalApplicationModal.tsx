/**
 * RentalApplicationModal Component — Clean Light Mode
 *
 * Smooth application submission with:
 * - Selected unit summary & financial breakdown
 * - Move-in calendar selection & personalized message
 * - Instant submission state with animated checkmark
 * - Legal non-binding trust notice
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { PropertyListing, UnitDetail, RentalApplication } from '@/types/tenant';
import { tenantService } from '@/features/tenant/tenant.service';

interface RentalApplicationModalProps {
  property: PropertyListing | null;
  selectedUnit: UnitDetail | null;
  accessToken?: string | null;
  onClose: () => void;
  onApplicationSubmitted: (app: RentalApplication) => void;
}

export function RentalApplicationModal({
  property,
  selectedUnit,
  accessToken,
  onClose,
  onApplicationSubmitted,
}: RentalApplicationModalProps) {
  if (!property || !selectedUnit) return null;

  const [activeUnit, setActiveUnit] = useState<UnitDetail>(selectedUnit);
  const [proposedMoveIn, setProposedMoveIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [message, setMessage] = useState<string>(
    'Hello, I am interested in leasing this unit. I am a working professional seeking a peaceful home. I look forward to your review.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<RentalApplication | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const app = await tenantService.submitApplication(
        {
          unitId: activeUnit.id,
          propertyId: property.id,
          proposedMoveIn,
          message,
          propertyTitle: property.title,
          propertyAddress: property.address,
          propertyCity: property.city,
          unitIdentifier: activeUnit.unitIdentifier,
          monthlyRent: activeUnit.monthlyRent,
          securityDeposit: activeUnit.securityDeposit,
          landlordName: property.landlord.name,
        },
        accessToken
      );

      setSubmittedApp(app);
      onApplicationSubmitted(app);
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Rental Application</h2>
              <p className="text-xs text-slate-500">Apply for a verified tenancy agreement</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form or Success State */}
          {submittedApp ? (
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm"
              >
                <CheckCircle2 className="w-9 h-9" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-600">
                Your application for <strong className="text-slate-900">{activeUnit.unitIdentifier}</strong> at{' '}
                {property.title} has been forwarded to {property.landlord.name}.
              </p>

              <div className="p-4 rounded-2xl text-xs text-left space-y-2.5 my-4 bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application ID:</span>
                  <span className="font-mono font-bold text-brand-600">{submittedApp.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Move-in:</span>
                  <span className="font-semibold text-slate-800">{submittedApp.proposedMoveIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-bold text-slate-900 font-display">
                    NPR {activeUnit.monthlyRent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors font-display shadow-xs"
                >
                  Track in Applications Tab
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Property & Unit Card */}
              <div className="p-4 rounded-2xl space-y-3 bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-display">{property.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-display">
                    Available
                  </span>
                </div>

                {/* Unit Switcher if multiple available */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-display text-slate-500">
                    Select Unit
                  </label>
                  <select
                    value={activeUnit.id}
                    onChange={(e) => {
                      const u = property.units.find((unit: UnitDetail) => unit.id === e.target.value);
                      if (u) setActiveUnit(u);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {property.units.map((u: UnitDetail) => (
                      <option key={u.id} value={u.id} disabled={u.availabilityStatus !== 'AVAILABLE'}>
                        {u.unitIdentifier} — Floor {u.floorNumber} ({u.bedrooms} BHK) — NPR{' '}
                        {u.monthlyRent.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Summary */}
                <div className="pt-2.5 flex items-center justify-between text-xs border-t border-slate-200">
                  <div>
                    <span className="block text-slate-500">Agreed Rent:</span>
                    <strong className="text-slate-900 font-display text-sm">
                      NPR {activeUnit.monthlyRent.toLocaleString()}
                    </strong>{' '}
                    <span className="text-slate-500">/ mo</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500">Security Deposit:</span>
                    <strong className="text-slate-900 font-display text-sm">
                      NPR {activeUnit.securityDeposit.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Move-in Date Picker */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1.5 font-display text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Proposed Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={proposedMoveIn}
                  onChange={(e) => setProposedMoveIn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Message to Landlord */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1.5 font-display text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Introduction to Landlord
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details about yourself, employment, household size..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-2xl text-[11px] flex items-start gap-2.5 bg-brand-50/70 border border-brand-200 text-brand-900">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Submitting this application does not bind you to financial payment until the landlord
                  approves and both parties sign the digital lease agreement.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors font-display shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
