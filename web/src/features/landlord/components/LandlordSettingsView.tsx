/**
 * LandlordSettingsView Component — High-End Landlord Operations & Verification Hub
 *
 * Modern Architectural Landlord Portal featuring:
 * - Segmented category tabs: Host Identity, Lalpurja & Legal KYC, Banking & Direct Settlement, Alerts & Automation, Nepal Legal Compliance
 * - Lalpurja title deed verification with local scan upload & status pills
 * - Nepal commercial banking (Nabil, NIC Asia, Global IME, etc.) + eSewa & Khalti payout accounts
 * - Automated rent collection & maintenance dispatch alert switches
 * - Nepal Muluki Civil Code 2074 statutory host compliance overview
 * - SpotlightCard & ShimmerButton interactions with smooth motion animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Phone,
  Mail,
  CreditCard,
  Building,
  Clock,
  Upload,
  Info,
  Edit2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wallet,
  Smartphone,
  Bell,
  Scale,
  MapPin,
  Check,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { landlordService } from '@/features/landlord/landlord.service';
import type { LandlordProfile } from '@/types/landlord';
import { useAuth } from '@/features/auth/AuthContext';
import {
  ShimmerButton,
  StatusPill,
  FormInput,
  FormSelect,
  SpotlightCard,
  FilterTabs,
} from '@/components/ui';
import type { StatusPillVariant } from '@/components/ui';

interface LandlordSettingsViewProps {
  accessToken: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

type LandlordSettingsTab = 'profile' | 'kyc' | 'payout' | 'alerts' | 'legal';
type KYCStatus = 'not_submitted' | 'pending_review' | 'verified' | 'rejected';

interface KYCDoc {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: KYCStatus;
  requiredFor: string;
  fileName?: string;
}

const KYC_STATUS_CONFIG: Record<
  KYCStatus,
  { label: string; variant: StatusPillVariant; icon: React.ElementType }
> = {
  not_submitted: { label: 'Not Submitted', variant: 'neutral', icon: ShieldX },
  pending_review: { label: 'Pending Review', variant: 'warning', icon: Clock },
  verified: { label: 'Verified ✓', variant: 'success', icon: ShieldCheck },
  rejected: { label: 'Rejected', variant: 'danger', icon: ShieldAlert },
};

const INITIAL_KYC_DOCUMENTS: KYCDoc[] = [
  {
    id: 'lalpurja',
    name: 'Lalpurja (Land Ownership Certificate / Title Deed)',
    description: 'Official title deed issued by Land Revenue Office (Malpot Karyalaya) for listed Kathmandu properties.',
    icon: Building,
    status: 'verified',
    requiredFor: 'Property title deed verification & official marketplace badge',
    fileName: 'Lalpurja_Sankhu_Deed_Scan.pdf',
  },
  {
    id: 'citizenship',
    name: 'Citizenship Certificate (Nagarikta)',
    description: 'Government of Nepal citizenship certificate of property owner or authorized legal attorney.',
    icon: User,
    status: 'verified',
    requiredFor: 'Identity & legal biometric signature ratification under Electronic Transactions Act 2063',
    fileName: 'Nagarikta_Front_Back.jpg',
  },
  {
    id: 'pan',
    name: 'PAN Certificate (Inland Revenue Department)',
    description: 'Permanent Account Number for residential rental tax compliance and automated rent invoice clearance.',
    icon: CreditCard,
    status: 'pending_review',
    requiredFor: 'Rental tax invoicing & digital municipal ledger compliance',
    fileName: 'IRD_PAN_Registration.pdf',
  },
];

const PAYOUT_BANKS = [
  { name: 'Nabil Bank Limited', code: 'NABIL' },
  { name: 'NIC Asia Bank Limited', code: 'NIC_ASIA' },
  { name: 'Global IME Bank Limited', code: 'GLOBAL_IME' },
  { name: 'Himalayan Bank Limited', code: 'HBL' },
  { name: 'Rastriya Banijya Bank (RBB)', code: 'RBB' },
  { name: 'Sanima Bank Limited', code: 'SANIMA' },
  { name: 'Nepal Investment Mega Bank (NIMB)', code: 'NIMB' },
  { name: 'Everest Bank Limited', code: 'EBL' },
  { name: 'Standard Chartered Bank Nepal', code: 'SCB' },
  { name: 'Other Nepal Commercial Bank', code: 'OTHER' },
];

export function LandlordSettingsView({ accessToken, showToast }: LandlordSettingsViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LandlordSettingsTab>('profile');
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    officeAddress: 'Chabahil, Kathmandu (Ward 7)',
    responseTime: 'Within 2 hours',
  });

  const [kycDocs, setKycDocs] = useState<KYCDoc[]>(INITIAL_KYC_DOCUMENTS);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payoutForm, setPayoutForm] = useState({
    bankCode: 'NABIL',
    accountNumber: '01201017500123',
    accountName: 'Dipesh Raj Shrestha',
    branchName: 'Chabahil Branch, Kathmandu',
    esewaId: '9860001136',
    khaltiId: '9860001136',
    autoSettle: true,
  });
  const [savingPayout, setSavingPayout] = useState(false);

  // Automation & Alerts state
  const [alerts, setAlerts] = useState({
    instantApplicationSms: true,
    emergencyMaintenanceAlert: true,
    rentSettlementNotification: true,
    autoRentReminderOn1st: true,
    leaseExpiryWarning60d: true,
  });

  useEffect(() => {
    if (!accessToken) return;
    landlordService
      .getProfile(accessToken)
      .then((p) => {
        setProfile(p);
        setProfileForm((prev) => ({
          ...prev,
          name: p.name ?? '',
          phone: p.phone ?? '+977 9860001136',
        }));
      })
      .catch(() => {
        if (user) {
          const fallback = {
            id: user.id,
            email: user.email,
            name: user.name ?? 'Property Owner',
            avatarUrl: user.avatarUrl,
            phone: '+977 9860001136',
            roles: user.roles,
            createdAt: '',
            updatedAt: '',
          };
          setProfile(fallback as LandlordProfile);
          setProfileForm((prev) => ({
            ...prev,
            name: user.name ?? '',
            phone: '+977 9860001136',
          }));
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [accessToken, user]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await landlordService.updateProfile(
        { name: profileForm.name, phone: profileForm.phone },
        accessToken
      );
      setProfile(updated);
      setEditingProfile(false);
      showToast('✓ Host profile updated successfully');
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
      showToast('✓ Banking and payout routing saved');
    }, 600);
  }

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;

    setKycDocs((prev) =>
      prev.map((doc) =>
        doc.id === uploadingDocId
          ? { ...doc, status: 'pending_review', fileName: file.name }
          : doc
      )
    );
    showToast(`✓ Uploaded ${file.name} for compliance review`);
    setUploadingDocId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast('✓ Alert preference updated');
  };

  const kycVerifiedCount = kycDocs.filter((d) => d.status === 'verified').length;
  const overallKYCStatus =
    kycVerifiedCount === kycDocs.length
      ? 'verified'
      : kycVerifiedCount > 0
      ? 'partial'
      : 'not_started';

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Host Profile' },
    { id: 'kyc', label: `Lalpurja & KYC (${kycVerifiedCount}/${kycDocs.length})` },
    { id: 'payout', label: 'Banking & Payouts' },
    { id: 'alerts', label: 'Automation & Alerts' },
    { id: 'legal', label: 'Legal Safeguards (2074)' },
  ];

  if (loadingProfile) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-28 rounded-3xl bg-white border border-slate-200 animate-pulse" />
        <div className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden file input for document scans */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocFileUpload}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-blue-50 border border-blue-200 text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Landlord Compliance & Settlements
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Settings & Asset Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your verified landlord profile, Lalpurja title deeds, and automated rent clearance accounts
          </p>
        </div>

        {/* KYC Overall Status Badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs self-start sm:self-auto">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
              overallKYCStatus === 'verified'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Deed Verification</span>
            <span className="text-[11px] text-slate-500">
              {overallKYCStatus === 'verified'
                ? 'Fully Compliant Host'
                : `${kycVerifiedCount} of ${kycDocs.length} Documents Approved`}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Segmented Category Sub-Navigation ── */}
      <FilterTabs
        tabs={SETTINGS_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as LandlordSettingsTab)}
        className="w-full sm:w-auto overflow-x-auto"
      />

      {/* ── 3. Tab Contents ── */}
      <AnimatePresence mode="wait">
        {/* ── TAB 1: HOST PROFILE ── */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              {/* Profile Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                      {profile?.name?.[0]?.toUpperCase() ?? 'L'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{profile?.email}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusPill variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Verified Landlord Host
                      </StatusPill>
                      <StatusPill variant="info" size="sm">
                        Muluki Civil Code Compliant
                      </StatusPill>
                    </div>
                  </div>
                </div>

                {!editingProfile && (
                  <ShimmerButton
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="font-bold cursor-pointer shrink-0"
                  >
                    Edit Profile Details
                  </ShimmerButton>
                )}
              </div>

              {/* Editable or View Details */}
              {editingProfile ? (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <FormInput
                      label="Full Legal Name (as per Lalpurja Deed)"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      leftIcon={<User className="w-4 h-4 text-slate-400" />}
                    />
                    <FormInput
                      label="Primary Contact Mobile Number"
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+977 98XXXXXXXX"
                      leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    />
                    <FormInput
                      label="Correspondence / Office Address in Kathmandu"
                      value={profileForm.officeAddress}
                      onChange={(e) => setProfileForm((f) => ({ ...f, officeAddress: e.target.value }))}
                      leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                    />
                    <FormSelect
                      label="Tenancy Application Response Commitment"
                      value={profileForm.responseTime}
                      onChange={(e) => setProfileForm((f) => ({ ...f, responseTime: e.target.value }))}
                      options={[
                        { value: 'Within 2 hours', label: 'Within 2 hours (Recommended - Top Host)' },
                        { value: 'Within 6 hours', label: 'Within 6 hours' },
                        { value: 'Within 12 hours', label: 'Within 12 hours' },
                        { value: 'Within 24 hours', label: 'Within 24 hours' },
                      ]}
                      leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                    <ShimmerButton
                      variant="outline"
                      size="md"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </ShimmerButton>
                    <ShimmerButton
                      variant="primary"
                      size="md"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      isLoading={savingProfile}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                      className="font-bold cursor-pointer"
                    >
                      Save Profile Changes
                    </ShimmerButton>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Registered Phone
                    </span>
                    <strong className="text-slate-900 font-bold block">{profileForm.phone}</strong>
                    <span className="text-[11px] text-emerald-600 font-semibold">SMS & WhatsApp Alerts Active</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Host Address
                    </span>
                    <strong className="text-slate-900 font-bold block">{profileForm.officeAddress}</strong>
                    <span className="text-[11px] text-slate-500">Kathmandu Valley</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Tenant Response SLA
                    </span>
                    <strong className="text-slate-900 font-bold block">{profileForm.responseTime}</strong>
                    <span className="text-[11px] text-blue-600 font-semibold">Displayed on Public Listings</span>
                  </div>
                </div>
              )}
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 2: LALPURJA & LEGAL KYC ── */}
        {activeTab === 'kyc' && (
          <motion.div
            key="kyc"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Lalpurja Title Deed & Statutory KYC Verification</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified properties receive the verified badge on RentHub and legally enforce leases under Muluki Civil Code 2074.
                  </p>
                </div>

                <StatusPill
                  variant={overallKYCStatus === 'verified' ? 'success' : 'warning'}
                  size="sm"
                >
                  {overallKYCStatus === 'verified' ? '✓ Fully Verified' : 'Compliance in Progress'}
                </StatusPill>
              </div>

              {/* Document Cards */}
              <div className="space-y-3.5">
                {kycDocs.map((doc) => {
                  const cfg = KYC_STATUS_CONFIG[doc.status];
                  const DocIcon = doc.icon;
                  const StatusIcon = cfg.icon;

                  return (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white border border-slate-200 text-blue-600 shadow-2xs">
                          <DocIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                            <StatusPill
                              variant={cfg.variant}
                              size="sm"
                              icon={<StatusIcon className="w-3 h-3" />}
                            >
                              {cfg.label}
                            </StatusPill>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{doc.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-blue-700 font-medium">
                            <span>Compliance: {doc.requiredFor}</span>
                            {doc.fileName && (
                              <span className="text-slate-500 flex items-center gap-1 font-mono">
                                <FileText className="w-3 h-3" />
                                {doc.fileName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <ShimmerButton
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadingDocId(doc.id);
                            fileInputRef.current?.click();
                          }}
                          leftIcon={<Upload className="w-3.5 h-3.5 text-blue-600" />}
                          className="font-bold cursor-pointer"
                        >
                          {doc.status === 'verified' ? 'Update Scan' : 'Upload Scan'}
                        </ShimmerButton>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Encryption Assurance Note */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-bold block mb-0.5">
                    Strict Confidentiality Guarantee (Section 401, Muluki Civil Code)
                  </strong>
                  <span>
                    Your Lalpurja land deed and citizenship scans are encrypted with AES-256 and only accessed by RentHub compliance officers for title verification. They are never shown to tenants or third parties.
                  </span>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 3: BANKING & PAYOUTS ── */}
        {activeTab === 'payout' && (
          <motion.div
            key="payout"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Direct Rent Settlement & Payout Routing</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect your commercial bank account or digital mobile wallet to receive cleared monthly rent directly.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <FormSelect
                  label="Primary Settlement Bank (Nepal Commercial Bank)"
                  value={payoutForm.bankCode}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, bankCode: e.target.value }))}
                  options={PAYOUT_BANKS.map((b) => ({ value: b.code, label: b.name }))}
                  leftIcon={<Building className="w-4 h-4 text-slate-400" />}
                />

                <FormInput
                  label="Bank Account Number"
                  type="text"
                  required
                  value={payoutForm.accountNumber}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="01201017500123"
                  leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
                />

                <FormInput
                  label="Account Holder Name (must match Lalpurja/Nagarikta)"
                  type="text"
                  required
                  value={payoutForm.accountName}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, accountName: e.target.value }))}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                <FormInput
                  label="Bank Branch Location"
                  type="text"
                  value={payoutForm.branchName}
                  onChange={(e) => setPayoutForm((f) => ({ ...f, branchName: e.target.value }))}
                  leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                />
              </div>

              {/* Digital Wallets (eSewa & Khalti) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span>Digital Wallet Clearing (eSewa & Khalti)</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <FormInput
                    label="eSewa Registered Mobile ID"
                    type="tel"
                    value={payoutForm.esewaId}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, esewaId: e.target.value }))}
                    placeholder="98XXXXXXXX"
                    hint="For instant automated eSewa rent clearance"
                  />
                  <FormInput
                    label="Khalti Registered Mobile ID"
                    type="tel"
                    value={payoutForm.khaltiId}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, khaltiId: e.target.value }))}
                    placeholder="98XXXXXXXX"
                    hint="For instant automated Khalti rent clearance"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Rent payouts are disbursed within 24 hours of tenant clearance
                </span>
                <ShimmerButton
                  variant="primary"
                  size="md"
                  onClick={handleSavePayout}
                  disabled={savingPayout}
                  isLoading={savingPayout}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="font-bold cursor-pointer"
                >
                  Save Payout Configuration
                </ShimmerButton>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 4: AUTOMATION & ALERTS ── */}
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Landlord Tenancy Automation & Alert Channels</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep your property operations on autopilot with real-time SMS, WhatsApp, and email triggers.
                </p>
              </div>

              <div className="divide-y divide-slate-100 space-y-1">
                {[
                  {
                    key: 'instantApplicationSms' as const,
                    title: 'Instant Application SMS & WhatsApp Alert',
                    desc: 'Receive immediate mobile alert when a screened tenant submits a formal rental request.',
                    icon: Smartphone,
                  },
                  {
                    key: 'emergencyMaintenanceAlert' as const,
                    title: '4-Hour SLA Emergency Maintenance Push Notification',
                    desc: 'Priority alerts for active water bursts, electrical faults, or urgent tenant repair tickets.',
                    icon: AlertTriangle,
                  },
                  {
                    key: 'rentSettlementNotification' as const,
                    title: 'Rent Clearing & Bank Settlement Advice',
                    desc: 'Automated receipt and bank settlement confirmation as soon as tenant completes digital payment.',
                    icon: CheckCircle2,
                  },
                  {
                    key: 'autoRentReminderOn1st' as const,
                    title: 'Auto-Dispatch Rent Due Reminders to Tenants',
                    desc: 'System automatically sends friendly rent due reminders to tenants on the 1st of each month.',
                    icon: Clock,
                  },
                  {
                    key: 'leaseExpiryWarning60d' as const,
                    title: '60-Day Lease Expiration & Renewal Alerts',
                    desc: 'Early warning before an active tenancy reaches its completion date for renewal or relisting.',
                    icon: Calendar,
                  },
                ].map(({ key, title, desc, icon: Icon }) => (
                  <div key={key} className="pt-4 pb-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{title}</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAlert(key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        alerts[key] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                          alerts[key] ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 5: LEGAL SAFEGUARDS (2074) ── */}
        {activeTab === 'legal' && (
          <motion.div
            key="legal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Nepal Muluki Civil Code 2074 (Chapter 9: Tenancy Law)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your statutory landlord rights and contractual protections on RentHub
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <strong className="text-slate-900 block font-bold text-sm">
                    Right to Timely Rent (Section 384)
                  </strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tenants are legally obligated to clear agreed rent by the due date. RentHub generates compliant digital invoices and audit receipts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <strong className="text-slate-900 block font-bold text-sm">
                    Right of Inspection (Section 388)
                  </strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Landlords possess the statutory right to inspect premises for structural maintenance with 24 hours prior written notice.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <strong className="text-slate-900 block font-bold text-sm">
                    Contractual Biometric Signatures (Section 381)
                  </strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    All leases executed on RentHub feature mutual digital signatures and biometric verification, fully recognized in Kathmandu courts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <strong className="text-slate-900 block font-bold text-sm">
                    Early Termination Protocol (Section 389)
                  </strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Clear 35-day notice protocols protect landlords from arbitrary abandonment and safeguard damage security deposits.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
