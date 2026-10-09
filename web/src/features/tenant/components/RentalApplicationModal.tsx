/**
 * RentalApplicationModal Component — Manus.im / Aceternity Dark Modal
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
      <div className="fixed inset-0 z-50 overflow-y-auto modal-overlay flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg card-premium overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(13,21,32,0.98) 0%, rgba(8,13,20,0.99) 100%)',
            border: '1px solid rgba(46, 139, 255, 0.25)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 35px rgba(46,139,255,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div>
              <h2 className="text-lg font-display font-bold text-white">Rental Application</h2>
              <p className="text-xs" style={{ color: '#5a7299' }}>Apply for a verified tenancy agreement</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:text-white"
              style={{ color: '#7187a5', background: 'rgba(255,255,255,0.03)' }}
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
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-display font-bold text-white">Application Submitted!</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: '#94aac5' }}>
                Your application for <strong className="text-white">{activeUnit.unitIdentifier}</strong> at{' '}
                {property.title} has been forwarded to {property.landlord.name}.
              </p>

              <div
                className="p-4 rounded-xl text-xs text-left space-y-2 my-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Application ID:</span>
                  <span className="font-mono font-semibold text-brand-400">{submittedApp.id}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Target Move-in:</span>
                  <span className="font-medium text-white">{submittedApp.proposedMoveIn}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a7299' }}>Monthly Rent:</span>
                  <span className="font-bold text-white font-display">
                    NPR {activeUnit.monthlyRent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary btn-md w-full shine-hover font-display"
                >
                  Track in Applications Tab
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Property & Unit Card */}
              <div
                className="p-4 rounded-2xl space-y-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1 font-display">{property.title}</h4>
                    <p className="text-xs" style={{ color: '#7187a5' }}>
                      {property.address}, {property.city}
                    </p>
                  </div>
                  <span className="badge-success">Available</span>
                </div>

                {/* Unit Switcher if multiple available */}
                <div>
                  <label
                    className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-display"
                    style={{ color: '#5a7299' }}
                  >
                    Select Unit
                  </label>
                  <select
                    value={activeUnit.id}
                    onChange={(e) => {
                      const u = property.units.find((unit) => unit.id === e.target.value);
                      if (u) setActiveUnit(u);
                    }}
                    className="form-select text-xs"
                  >
                    {property.units.map((u) => (
                      <option key={u.id} value={u.id} disabled={u.availabilityStatus !== 'AVAILABLE'}>
                        {u.unitIdentifier} — Floor {u.floorNumber} ({u.bedrooms} BHK) — NPR{' '}
                        {u.monthlyRent.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Summary */}
                <div
                  className="pt-2.5 flex items-center justify-between text-xs"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <div>
                    <span className="block" style={{ color: '#5a7299' }}>Agreed Rent:</span>
                    <strong className="text-white font-display text-sm">
                      NPR {activeUnit.monthlyRent.toLocaleString()}
                    </strong>{' '}
                    <span style={{ color: '#5a7299' }}>/ mo</span>
                  </div>
                  <div className="text-right">
                    <span className="block" style={{ color: '#5a7299' }}>Security Deposit:</span>
                    <strong className="text-white font-display text-sm">
                      NPR {activeUnit.securityDeposit.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Move-in Date Picker */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1.5 font-display" style={{ color: '#94aac5' }}>
                  <Calendar className="w-3.5 h-3.5 text-brand-400" /> Proposed Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={proposedMoveIn}
                  onChange={(e) => setProposedMoveIn(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              {/* Message to Landlord */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 flex items-center gap-1.5 font-display" style={{ color: '#94aac5' }}>
                  <MessageSquare className="w-3.5 h-3.5 text-brand-400" /> Introduction to Landlord
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details about yourself, employment, household size..."
                  className="form-input text-xs resize-none"
                />
              </div>

              {/* Notice */}
              <div
                className="p-3.5 rounded-xl text-[11px] flex items-start gap-2.5"
                style={{
                  background: 'rgba(46, 139, 255, 0.08)',
                  border: '1px solid rgba(46, 139, 255, 0.2)',
                  color: '#94aac5',
                }}
              >
                <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
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
                  className="btn-ghost btn-md flex-1 font-display"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary btn-md flex-1 shine-hover font-display"
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
