/**
 * WriteReviewModal Component — Airbnb & Zillow Grade Verified Review Flow
 *
 * Allows verified tenants with active or completed leases to submit
 * multi-dimensional feedback with:
 * - 5-star interactive rating for Overall, Cleanliness, Communication
 * - Pre-configured utility & amenity tag toggles
 * - Free-form detailed written commentary
 * - Instant validation and submission feedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Home,
} from 'lucide-react';
import { tenantService } from '../tenant.service';
import type { PropertyReview, CreateReviewInput } from '@/types/tenant';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  tenancyId: string;
  accessToken: string | null;
  onSuccess: (review: PropertyReview) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor — Significant issues',
  2: 'Fair — Needs improvement',
  3: 'Good — Met expectations',
  4: 'Very Good — Highly satisfied',
  5: 'Exceptional — Exceeded expectations',
};

const QUICK_TAGS = [
  '24/7 Treated Water Accurate',
  'Reliable Solar / Power Backup',
  'Prompt Maintenance Repairs',
  'Quiet & Respectful Neighborhood',
  'Transparent Utility Billing',
  'Accurate Listing Photos',
  'Peaceful & Safe Building',
  'Smooth Deposit Settlement',
];

export function WriteReviewModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  tenancyId,
  accessToken,
  onSuccess,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [hoverCleanliness, setHoverCleanliness] = useState<number | null>(null);

  const [communicationRating, setCommunicationRating] = useState<number>(5);
  const [hoverCommunication, setHoverCommunication] = useState<number | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1 || rating > 5) {
      setError('Please select an overall rating between 1 and 5 stars');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateReviewInput = {
        tenancy_id: tenancyId,
        rating,
        cleanliness_rating: cleanlinessRating,
        communication_rating: communicationRating,
        review_text: reviewText.trim() || null,
        amenities_feedback: selectedTags.length > 0 ? selectedTags.join(', ') : null,
      };

      const result = await tenantService.createPropertyReview(propertyId, payload, accessToken);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess(result);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verified Resident Review</h3>
              <p className="text-xs text-slate-500 truncate max-w-[260px] sm:max-w-[320px]">
                {propertyTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your verified review has been published. It helps future residents make confident housing decisions across Kathmandu Valley.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Verified Tenancy Badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Verified Tenancy: This review is linked to your official tenancy agreement.
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Overall Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Overall Experience <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-medium text-amber-700">
                {RATING_LABELS[hoverRating ?? rating]}
              </p>
            </div>

            {/* Detailed Sub-Ratings */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              {/* Cleanliness */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Cleanliness & Upkeep
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverCleanliness ?? cleanlinessRating) >= star;
                    return (
                      <button
                        key={`clean-${star}`}
                        type="button"
                        onMouseEnter={() => setHoverCleanliness(star)}
                        onMouseLeave={() => setHoverCleanliness(null)}
                        onClick={() => setCleanlinessRating(star)}
                        className="p-0.5 focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            active
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-[11px] font-bold text-slate-600 ml-1">
                    {hoverCleanliness ?? cleanlinessRating} / 5
                  </span>
                </div>
              </div>

              {/* Landlord Communication */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Landlord Communication
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverCommunication ?? communicationRating) >= star;
                    return (
                      <button
                        key={`comm-${star}`}
                        type="button"
                        onMouseEnter={() => setHoverCommunication(star)}
                        onMouseLeave={() => setHoverCommunication(null)}
                        onClick={() => setCommunicationRating(star)}
                        className="p-0.5 focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            active
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-[11px] font-bold text-slate-600 ml-1">
                    {hoverCommunication ?? communicationRating} / 5
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Experience Highlights (Tags) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Highlights & Utility Feedback (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Detailed Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Share more details about living here: water schedule reliability, electricity backup, neighborhood safety, landlord support..."
                className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 placeholder-slate-400 resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Authentic experiences help Nepali tenants find good homes</span>
                <span>{reviewText.length} / 2000</span>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publishing Review…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish Verified Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
