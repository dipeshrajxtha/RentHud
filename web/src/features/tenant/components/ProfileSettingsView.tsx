/**
 * ProfileSettingsView Component — Clean Light Profile & Settings
 *
 * Tenant Profile and Preferences Management:
 * - Google OAuth identity and verified legal name
 * - Housing preference recalibration trigger
 * - Role authorization status & sign out
 */

import { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  RotateCcw,
  Check,
  Save,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface ProfileSettingsViewProps {
  onRetakeOnboarding: () => void;
}

export function ProfileSettingsView({ onRetakeOnboarding }: ProfileSettingsViewProps) {
  const { user, signOut } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('+977-9860001136');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const preferences = tenantService.getPreferences();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await tenantService.updateProfile({ name, phone });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Profile & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage account details, verified credentials, and search preferences
        </p>
      </div>

      {/* Account Identity Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs">
              {user?.name?.[0] ?? 'T'}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Google OAuth Verified
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Phone Number (Nepal Mobile)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977-98XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1.5">
              Primary Email (Linked Account)
            </label>
            <div className="px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{user?.email ?? 'verified-user@gmail.com'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" /> Changes saved successfully
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving…' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* Onboarding Preferences Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Renter Housing Preferences</h3>
            <p className="text-xs text-slate-500">Your discovery feed is personalized according to these settings</p>
          </div>
          <button
            type="button"
            onClick={onRetakeOnboarding}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Questionnaire</span>
          </button>
        </div>

        {preferences ? (
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="block text-[11px] mb-0.5 text-slate-500">Home Layout</span>
              <strong className="text-slate-900 capitalize font-bold">{preferences.housingType.replace('_', ' ')}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="block text-[11px] mb-0.5 text-slate-500">Target Budget</span>
              <strong className="text-slate-900 capitalize font-bold">{preferences.budgetBracket}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="block text-[11px] mb-0.5 text-slate-500">Move-in Timeline</span>
              <strong className="text-slate-900 capitalize font-bold">{preferences.moveInTimeline.replace('_', ' ')}</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="block text-[11px] mb-0.5 text-slate-500">Household</span>
              <strong className="text-slate-900 capitalize font-bold">{preferences.householdSize}</strong>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No custom preferences configured yet.</p>
        )}
      </div>

      {/* Account Verification & Role Status */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Account Authorization</h3>
          <p className="text-xs text-slate-500">RentHub operates on a single verified role architecture</p>
        </div>

        <div className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-blue-50/50 border border-blue-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <strong className="text-slate-900 font-bold">Active Role: Tenant (Resident)</strong>
            </div>
            <p className="text-slate-600">
              Authorized for Kathmandu Valley property discovery, digital applications, and legal electronic leases.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 shrink-0">
            <Check className="w-3.5 h-3.5" /> Verified Tenant Account
          </span>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of RentHub</span>
        </button>
      </div>
    </div>
  );
}
