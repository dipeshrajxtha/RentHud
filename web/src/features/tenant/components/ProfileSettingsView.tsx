/**
 * ProfileSettingsView Component
 */

import { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  Building,
  RotateCcw,
  Check,
  Save,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';

interface ProfileSettingsViewProps {
  onRetakeOnboarding: () => void;
  onSwitchView?: (view: 'landlord' | 'tenant') => void;
}

export function ProfileSettingsView({ onRetakeOnboarding, onSwitchView }: ProfileSettingsViewProps) {
  const { user, addRole, signOut } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('+977-9860001136');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);

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

  const handleAddLandlord = async () => {
    if (user?.roles?.includes('landlord')) return;
    setAddingRole(true);
    setRoleMessage(null);
    try {
      await addRole('landlord');
      setRoleMessage('Landlord role added successfully! You can now switch between tenant and landlord portals.');
    } catch (err: any) {
      setRoleMessage(err.message || 'Failed to add landlord role');
    } finally {
      setAddingRole(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-900">Profile & Settings</h2>
        <p className="text-xs text-slate-500">Manage account details, verified credentials, and search preferences</p>
      </div>

      {/* Account Identity Card */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full ring-2 ring-brand-100 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 font-bold text-xl flex items-center justify-center">
              {user?.name?.[0] ?? 'T'}
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900">{user?.name}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Google OAuth Verified
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone Number (Nepal Mobile)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977-98XXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">Primary Email (Linked Account)</label>
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email ?? 'verified-user@gmail.com'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" /> Changes saved successfully
            </span>
          )}
          <span />

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving…' : 'Save Profile'}</span>
          </button>
        </div>
      </form>

      {/* Onboarding Preferences Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-display font-semibold text-slate-900">Renter Housing Preferences</h3>
            <p className="text-xs text-slate-500">Your discovery feed is personalized according to these settings</p>
          </div>
          <button
            type="button"
            onClick={onRetakeOnboarding}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Questionnaire</span>
          </button>
        </div>

        {preferences ? (
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Home Layout</span>
              <strong className="text-slate-800 capitalize font-medium">{preferences.housingType.replace('_', ' ')}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Target Budget</span>
              <strong className="text-slate-800 capitalize font-medium">{preferences.budgetBracket}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Move-in Timeline</span>
              <strong className="text-slate-800 capitalize font-medium">{preferences.moveInTimeline.replace('_', ' ')}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px]">Household</span>
              <strong className="text-slate-800 capitalize font-medium">{preferences.householdSize}</strong>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No custom preferences configured yet.</p>
        )}
      </div>

      {/* Multi-role expansion */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-display font-semibold text-slate-900">Account Roles</h3>
          <p className="text-xs text-slate-500">RentHub allows holding both Tenant and Landlord roles on a single account</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-4 h-4 text-emerald-600" />
              <strong className="text-slate-900 font-semibold">Landlord Portal Access</strong>
            </div>
            <p className="text-slate-500">List properties, review incoming tenant applications, and issue digital leases.</p>
          </div>

          {user?.roles?.includes('landlord') ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-lg shrink-0 text-xs">
                Active Role
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onSwitchView) onSwitchView('landlord');
                  else window.location.search = '?view=landlord';
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors shrink-0 text-xs flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Open Landlord Portal</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={addingRole}
              onClick={handleAddLandlord}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition-colors shrink-0"
            >
              {addingRole ? 'Activating…' : 'Add Landlord Role'}
            </button>
          )}
        </div>

        {roleMessage && (
          <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            {roleMessage}
          </p>
        )}
      </div>

      {/* Sign Out */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => signOut()}
          className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of RentHub</span>
        </button>
      </div>
    </div>
  );
}
