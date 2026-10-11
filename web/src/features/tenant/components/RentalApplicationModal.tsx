/**
 * RentalApplicationModal Component — Upgraded with Modern UI Primitives
 *
 * Smooth application submission with:
 * - Selected unit summary & financial breakdown
 * - Move-in calendar selection & personalized message
 * - ShimmerButton action and StatusPill indicators
 * - Legal non-binding trust notice
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { PropertyListing, UnitDetail, RentalApplication } from '@/types/tenant';
import { tenantService } from '@/features/tenant/tenant.service';
import { FormInput, ShimmerButton, StatusPill } from '@/components/ui';

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
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">Rental Application</h2>
                <StatusPill variant="info" size="sm">Pre-Lease</StatusPill>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Apply for a verified tenancy agreement</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form or Success State */}
          {submittedApp ? (
            <div className="p-7 text-center space-y-4">
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

              <div className="p-4 rounded-2xl text-xs text-left space-y-2.5 my-4 bg-slate-50 border border-slate-200/90">
                <div className="flex justify-between">
                  <span className="text-slate-500">Application ID:</span>
                  <span className="font-mono font-bold text-blue-600">{submittedApp.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Move-in:</span>
                  <span className="font-semibold text-slate-800">{submittedApp.proposedMoveIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    NPR {activeUnit.monthlyRent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full"
                >
                  Track in Applications Tab
                </ShimmerButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Property & Unit Card */}
              <div className="p-4 rounded-2xl space-y-3 bg-slate-50/80 border border-slate-200/90">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-display">{property.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <StatusPill variant="success" size="sm">Available</StatusPill>
                </div>

                {/* Unit Switcher if multiple available */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider block text-slate-500 font-mono">
                    Select Available Unit
                  </label>
                  <select
                    value={activeUnit.id}
                    onChange={(e) => {
                      const u = property.units.find((unit: UnitDetail) => unit.id === e.target.value);
                      if (u) setActiveUnit(u);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 shadow-sm"
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
                <div className="pt-2.5 flex items-center justify-between text-xs border-t border-slate-200/80">
                  <div>
                    <span className="block text-slate-500">Agreed Rent:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      NPR {activeUnit.monthlyRent.toLocaleString()}
                    </strong>{' '}
                    <span className="text-slate-400">/ mo</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500">Security Deposit:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      NPR {activeUnit.securityDeposit.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Move-in Date Picker */}
              <FormInput
                label="Proposed Move-in Date"
                type="date"
                required
                leftIcon={<Calendar className="w-4 h-4 text-blue-600" />}
                value={proposedMoveIn}
                onChange={(e) => setProposedMoveIn(e.target.value)}
              />

              {/* Message to Landlord */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Introduction to Landlord</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details about yourself, employment, household size..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 resize-none shadow-sm transition-all"
                />
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-2xl text-[11px] flex items-start gap-2.5 bg-blue-50/70 border border-blue-200 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Submitting this application does not bind you to financial payment until the landlord
                  approves and both parties sign the digital lease agreement.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <ShimmerButton
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Submit Application
                </ShimmerButton>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
