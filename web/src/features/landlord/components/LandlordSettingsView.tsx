/**
 * LandlordSettingsView — Phase 6
 *
 * Profile management, Lalpurja/KYC verification status, payout accounts.
 * Connects to PATCH /api/landlords/me and GET /api/landlords/me.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings, User, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Phone, Mail, CreditCard, Building,
  Clock, Upload, Info, Edit2, Save, Home,
} from 'lucide-react';
import { landlordService } from '@/features/landlord/landlord.service';
import type { LandlordProfile } from '@/types/landlord';
import { useAuth } from '@/features/auth/AuthContext';

interface LandlordSettingsViewProps {
  accessToken: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onSwitchView?: (view: 'landlord' | 'tenant') => void;
}

type KYCStatus = 'not_submitted' | 'pending_review' | 'verified' | 'rejected';

interface KYCDoc {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: KYCStatus;
  requiredFor: string;
}

const KYC_STATUS_CONFIG: Record<KYCStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_submitted: { label: 'Not Submitted', color: 'text-slate-600', bg: 'bg-slate-100', icon: ShieldX },
  pending_review: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  verified: { label: 'Verified ✓', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: ShieldCheck },
  rejected: { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-50', icon: ShieldAlert },
};

// Mock KYC state — in production this would come from /api/landlords/me/kyc
const KYC_DOCUMENTS: KYCDoc[] = [
  {
    id: 'lalpurja',
    name: 'Lalpurja (Ownership Certificate)',
    description: 'Land ownership certificate (Lalpurja) issued by the Land Revenue Office for all listed properties.',
    icon: Building,
    status: 'not_submitted',
    requiredFor: 'Property ownership verification',
  },
  {
    id: 'citizenship',
    name: 'Citizenship Certificate',
    description: 'Nepal citizenship certificate (Nagarikta Pramaan Patra) of the property owner.',
    icon: User,
    status: 'not_submitted',
    requiredFor: 'Identity verification',
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'Permanent Account Number card issued by the Inland Revenue Department of Nepal.',
    icon: CreditCard,
    status: 'not_submitted',
    requiredFor: 'Tax compliance',
  },
];

const PAYOUT_BANKS = [
  { name: 'Nabil Bank', code: 'NABIL' },
  { name: 'NIC Asia Bank', code: 'NIC_ASIA' },
  { name: 'Global IME Bank', code: 'GLOBAL_IME' },
  { name: 'Himalayan Bank', code: 'HBL' },
  { name: 'Rastriya Banijya Bank', code: 'RBB' },
  { name: 'Other', code: 'OTHER' },
];

export function LandlordSettingsView({ accessToken, showToast, onSwitchView }: LandlordSettingsViewProps) {
  const { user, addRole } = useAuth();
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [kycDocs] = useState<KYCDoc[]>(KYC_DOCUMENTS);

  const [payoutForm, setPayoutForm] = useState({ bankCode: '', accountNumber: '', accountName: '', mobileWallet: '' });
  const [savingPayout, setSavingPayout] = useState(false);

  const [addingTenantRole, setAddingTenantRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);

  const handleAddTenant = async () => {
    if (user?.roles?.includes('tenant')) return;
    setAddingTenantRole(true);
    setRoleMessage(null);
    try {
      await addRole('tenant');
      setRoleMessage('Tenant role added successfully! You can now switch between tenant and landlord portals.');
      showToast('✓ Tenant role activated');
    } catch (err: any) {
      setRoleMessage(err.message || 'Failed to add tenant role');
      showToast('Failed to add tenant role', 'error');
    } finally {
      setAddingTenantRole(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    landlordService.getProfile(accessToken)
      .then((p) => {
        setProfile(p);
        setProfileForm({ name: p.name ?? '', phone: p.phone ?? '' });
      })
      .catch(() => {
        // Fallback to auth context user
        if (user) {
          const fallback = { id: user.id, email: user.email, name: user.name ?? '', avatarUrl: user.avatarUrl, phone: null, roles: user.roles, createdAt: '', updatedAt: '' };
          setProfile(fallback as LandlordProfile);
          setProfileForm({ name: user.name ?? '', phone: '' });
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [accessToken, user]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await landlordService.updateProfile(profileForm, accessToken);
      setProfile(updated);
      setEditingProfile(false);
      showToast('✓ Profile updated');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleSavePayout() {
    setSavingPayout(true);
    setTimeout(() => {
      setSavingPayout(false);
      showToast('✓ Payout account details saved');
    }, 800);
  }

  if (loadingProfile) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  const kycVerified = kycDocs.filter((d) => d.status === 'verified').length;
  const overallKYCStatus = kycVerified === kycDocs.length ? 'verified' : kycVerified > 0 ? 'partial' : 'not_started';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" />
          Settings & Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your landlord profile, KYC documents, and payout accounts</p>
      </div>

      {/* ── Profile Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            Landlord Profile
          </h2>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-100" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                {profile?.name?.[0]?.toUpperCase() ?? 'L'}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900">{profile?.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3" />
                {profile?.email}
              </p>
              {profile?.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {profile.phone}
                </p>
              )}
            </div>
          </div>

          {editingProfile ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-xs text-slate-500">
              Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </div>
          )}
        </div>
      </div>

      {/* ── KYC Verification ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              Ownership Verification (KYC)
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              overallKYCStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' :
              overallKYCStatus === 'partial' ? 'bg-amber-50 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {overallKYCStatus === 'verified' ? '✓ Fully Verified' :
               overallKYCStatus === 'partial' ? `${kycVerified}/${kycDocs.length} Verified` :
               'Not Verified'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verify property ownership and identity to unlock full platform trust features.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {kycDocs.map((doc) => {
            const cfg = KYC_STATUS_CONFIG[doc.status];
            const DocIcon = doc.icon;
            const StatusIcon = cfg.icon;

            return (
              <div key={doc.id} className="p-5 flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <DocIcon className="w-4.5 h-4.5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} flex items-center gap-1`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{doc.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 italic">Required for: {doc.requiredFor}</p>
                </div>
                {doc.status === 'not_submitted' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors shrink-0">
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>All submitted documents are reviewed by the RentHub compliance team within 2–5 working days. Documents are stored securely and are not shared with tenants.</span>
          </div>
        </div>
      </div>

      {/* ── Payout Accounts ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-600" />
            Payout Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure the bank account or mobile wallet where collected rent will be deposited.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank</label>
              <select
                value={payoutForm.bankCode}
                onChange={(e) => setPayoutForm((f) => ({ ...f, bankCode: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
              >
                <option value="">Select bank…</option>
                {PAYOUT_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={payoutForm.accountNumber}
                onChange={(e) => setPayoutForm((f) => ({ ...f, accountNumber: e.target.value }))}
                placeholder="0012345678901"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
            <input
              type="text"
              value={payoutForm.accountName}
              onChange={(e) => setPayoutForm((f) => ({ ...f, accountName: e.target.value }))}
              placeholder="As registered in the bank"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Wallet (eSewa / Khalti) <span className="text-slate-400 font-normal">— optional</span>
            </label>
            <input
              type="text"
              value={payoutForm.mobileWallet}
              onChange={(e) => setPayoutForm((f) => ({ ...f, mobileWallet: e.target.value }))}
              placeholder="98XXXXXXXX"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
            />
          </div>
          <button
            onClick={handleSavePayout}
            disabled={savingPayout}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {savingPayout ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save Payout Details</>
            )}
          </button>
        </div>
      </div>

      {/* ── Account Roles & Dual-Portal Switcher ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              Account Roles & Portal Switching
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              RentHub allows holding both Landlord and Tenant roles on a single account
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-brand-600" />
                <strong className="text-slate-900 font-semibold">Tenant Portal Access</strong>
              </div>
              <p className="text-slate-500">
                Browse verified properties, submit rental applications, sign digital leases, and pay rent in Nepal.
              </p>
            </div>

            {user?.roles?.includes('tenant') ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-semibold rounded-lg shrink-0 text-xs border border-brand-200">
                  Active Role
                </span>
                <button
                  type="button"
                  onClick={() => onSwitchView?.('tenant')}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-xs transition-colors shrink-0 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Open Tenant Portal</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={addingTenantRole}
                onClick={handleAddTenant}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                {addingTenantRole ? 'Activating…' : 'Add Tenant Role'}
              </button>
            )}
          </div>

          {roleMessage && (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              {roleMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
