/**
 * RentalApplicationModal Component
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, MessageSquare, ShieldCheck, CheckCircle2, Bed, Bath } from 'lucide-react';
import type { PropertyListing, UnitDetail, RentalApplication } from '@/types/tenant';
import { tenantService } from '@/features/tenant/tenant.service';

interface RentalApplicationModalProps {
  property: PropertyListing | null;
  selectedUnit: UnitDetail | null;
  onClose: () => void;
  onApplicationSubmitted: (app: RentalApplication) => void;
}

export function RentalApplicationModal({
  property,
  selectedUnit,
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
      const app = await tenantService.submitApplication({
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
      });

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-display font-semibold text-slate-900">Rental Application</h2>
              <p className="text-xs text-slate-500">Apply for a verified tenancy agreement</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form or Success State */}
          {submittedApp ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-semibold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your application for <strong>{activeUnit.unitIdentifier}</strong> at {property.title} has been forwarded to {property.landlord.name}.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 my-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Application ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{submittedApp.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Move-in:</span>
                  <span className="font-medium text-slate-800">{submittedApp.proposedMoveIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Rent:</span>
                  <span className="font-semibold text-brand-950">NPR {activeUnit.monthlyRent.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Track in Applications Tab
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Property & Unit Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{property.title}</h4>
                    <p className="text-xs text-slate-500">{property.address}, {property.city}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Available
                  </span>
                </div>

                {/* Unit Switcher if multiple available */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Select Unit
                  </label>
                  <select
                    value={activeUnit.id}
                    onChange={(e) => {
                      const u = property.units.find((unit) => unit.id === e.target.value);
                      if (u) setActiveUnit(u);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {property.units.map((u) => (
                      <option key={u.id} value={u.id} disabled={u.availabilityStatus !== 'AVAILABLE'}>
                        {u.unitIdentifier} — Floor {u.floorNumber} ({u.bedrooms} BHK) — NPR {u.monthlyRent.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Summary */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Agreed Rent:</span>
                    <strong className="text-slate-900 font-display">NPR {activeUnit.monthlyRent.toLocaleString()}</strong> / mo
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Security Deposit:</span>
                    <strong className="text-slate-900 font-display">NPR {activeUnit.securityDeposit.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Move-in Date Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Proposed Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={proposedMoveIn}
                  onChange={(e) => setProposedMoveIn(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Message to Landlord */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-600" /> Introduction to Landlord
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details about yourself, employment, household size..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200 text-[11px] text-brand-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Submitting this application does not bind you to financial payment until the landlord approves and both parties sign the digital lease agreement.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
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
