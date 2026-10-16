/**
 * ProfileSettingsView Component — High-End Tenant Settings & Profile Hub
 *
 * Modern Architectural Renter Portal featuring:
 * - Segmented category tabs: Profile & Identity, Housing Preferences, Notifications & Alerts, Security & Tenancy Rights
 * - Google OAuth identity, verified status & avatar customization
 * - Housing Survey Recalibration & live preference parameters (Muluki Civil Code 2074 compatible)
 * - Notification preferences & instant rent reminders (SMS, WhatsApp, Email)
 * - Legal tenant safeguards overview & linked sessions
 * - SpotlightCard & ShimmerButton interactions with smooth motion animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  RotateCcw,
  Check,
  Save,
  LogOut,
  Bell,
  SlidersHorizontal,
  Home,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Laptop,
  Lock,
  Calendar,
  DollarSign,
  MapPin,
  Heart,
  FileText,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { tenantService } from '@/features/tenant/tenant.service';
import {
  FormInput,
  ShimmerButton,
  StatusPill,
  SpotlightCard,
  FilterTabs,
} from '@/components/ui';

interface ProfileSettingsViewProps {
  onRetakeOnboarding: () => void;
}

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'security';

export function ProfileSettingsView({ onRetakeOnboarding }: ProfileSettingsViewProps) {
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '+977 9860001136');
  const [emergencyContact, setEmergencyContact] = useState('Anil Shrestha (+977 9841234567)');
  const [permanentAddress, setPermanentAddress] = useState('Kathmandu Metropolitan City, Ward 10');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    smsRentReminder: true,
    whatsappLeaseUpdates: true,
    maintenanceAlerts: true,
    legalNotices: true,
    marketTrends: false,
  });

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

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Personal Profile' },
    { id: 'preferences', label: 'Housing Survey' },
    { id: 'notifications', label: 'Alerts & Communications' },
    { id: 'security', label: 'Security & Legal Rights' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── 1. Page Header with Profile Completion Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-blue-50 border border-blue-200 text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Resident Account Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Settings & Resident Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your verified resident credentials, housing survey criteria, and communication channels
          </p>
        </div>

        {/* Profile completion badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100">
            95%
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Profile Completed</span>
            <span className="text-[11px] text-slate-400">Google OAuth Verified</span>
          </div>
        </div>
      </div>

      {/* ── 2. Segmented Category Sub-Navigation ── */}
      <FilterTabs
        tabs={SETTINGS_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTab)}
        className="w-full sm:w-auto overflow-x-auto"
      />

      {/* ── 3. Tab Contents ── */}
      <AnimatePresence mode="wait">
        {/* ── TAB 1: PERSONAL PROFILE ── */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <SpotlightCard className="p-6 sm:p-7 space-y-6">
                {/* Profile Identity Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                        {user?.name?.[0]?.toUpperCase() ?? 'T'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>{user?.email}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusPill variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                          Google OAuth Verified
                        </StatusPill>
                        <StatusPill variant="info" size="sm">
                          Primary Resident
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <FormInput
                    label="Full Legal Name (as in Nagarikta / Passport)"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User className="w-4 h-4 text-slate-400" />}
                    placeholder="e.g. Dipesh Raj Shrestha"
                  />

                  <FormInput
                    label="Contact Mobile (Nepal Telecom / Ncell)"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  />

                  <div className="sm:col-span-2">
                    <FormInput
                      label="Linked Primary Google Email"
                      value={user?.email ?? 'verified-user@gmail.com'}
                      disabled
                      hint="Primary authentication identity. Cannot be altered directly."
                      leftIcon={<Mail className="w-4 h-4 text-blue-600" />}
                    />
                  </div>

                  <FormInput
                    label="Permanent / Citizenship Municipality"
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                    placeholder="e.g. Kathmandu Metropolitan City, Ward 10"
                  />

                  <FormInput
                    label="Emergency Contact Person & Phone"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    placeholder="Name & Contact number"
                  />
                </div>

                {/* Submit Row */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {saveSuccess ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Profile updated successfully
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Changes will be reflected across your digital lease agreements
                    </span>
                  )}

                  <ShimmerButton
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="font-bold cursor-pointer"
                  >
                    Save Changes
                  </ShimmerButton>
                </div>
              </SpotlightCard>
            </form>
          </motion.div>
        )}

        {/* ── TAB 2: HOUSING PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Onboarding Housing Survey Profile
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your Explore feed and automated 100% Survey Recommendations are tuned to these preferences.
                  </p>
                </div>

                <ShimmerButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetakeOnboarding}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-600" />}
                  className="font-bold cursor-pointer shrink-0"
                >
                  Recalibrate Survey
                </ShimmerButton>
              </div>

              {preferences ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <Home className="w-3.5 h-3.5 text-blue-600" />
                      <span>Housing Layout</span>
                    </div>
                    <strong className="text-sm text-slate-900 capitalize block font-bold">
                      {preferences.housingType.replace('_', ' ')}
                    </strong>
                    <span className="text-[11px] text-slate-500">Target unit layout</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Target Budget</span>
                    </div>
                    <strong className="text-sm text-slate-900 capitalize block font-bold">
                      {preferences.budgetBracket}
                    </strong>
                    <span className="text-[11px] text-slate-500">Monthly rental bracket</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Move-in Timeline</span>
                    </div>
                    <strong className="text-sm text-slate-900 capitalize block font-bold">
                      {preferences.moveInTimeline.replace('_', ' ')}
                    </strong>
                    <span className="text-[11px] text-slate-500">Planned possession</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Household Size</span>
                    </div>
                    <strong className="text-sm text-slate-900 capitalize block font-bold">
                      {preferences.householdSize}
                    </strong>
                    <span className="text-[11px] text-slate-500">Occupant capacity</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-2">
                  <p className="text-xs text-slate-600">No custom preference survey configured yet.</p>
                  <ShimmerButton
                    variant="primary"
                    size="sm"
                    onClick={onRetakeOnboarding}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Take Preference Survey
                  </ShimmerButton>
                </div>
              )}

              {/* Priority Amenities Wishlist */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Configured Priority Amenities for 100% Matches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    '24/7 Water Supply',
                    'Dedicated Parking',
                    'Solar / Inverter Backup',
                    'High-Speed WiFi',
                    'Balcony / Terrace',
                    'CCTV Security',
                  ].map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 3: NOTIFICATIONS & COMMUNICATIONS ── */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
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
                  <span>Communication Channels & Alert Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure real-time automated SMS, WhatsApp, and email alerts for your tenancy.
                </p>
              </div>

              <div className="divide-y divide-slate-100 space-y-1">
                {[
                  {
                    key: 'smsRentReminder' as const,
                    title: 'SMS Rent Due Reminder (Nepal Mobile)',
                    desc: 'Receive SMS reminder 3 days before rent is due on the 5th of each Nepali/English month.',
                    icon: Smartphone,
                  },
                  {
                    key: 'whatsappLeaseUpdates' as const,
                    title: 'WhatsApp & Email Lease Offers',
                    desc: 'Instant alert when a landlord approves your rental application or uploads a digital lease contract.',
                    icon: Mail,
                  },
                  {
                    key: 'maintenanceAlerts' as const,
                    title: 'Maintenance Inspection & Technician Dispatch',
                    desc: 'Real-time updates when a technician is scheduled or enters your premises for repair.',
                    icon: Bell,
                  },
                  {
                    key: 'legalNotices' as const,
                    title: 'Legal Tenancy Notices (Muluki Civil Code 2074)',
                    desc: 'Statutory 35-day notice notifications and official digital agreement stamping confirmations.',
                    icon: ShieldCheck,
                  },
                  {
                    key: 'marketTrends' as const,
                    title: 'Kathmandu Valley Rental Trends & New Listings',
                    desc: 'Weekly summary of newly verified homes in your preferred neighborhood.',
                    icon: Sparkles,
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
                      onClick={() => toggleNotification(key)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        notifications[key] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                          notifications[key] ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </motion.div>
        )}

        {/* ── TAB 4: SECURITY & TENANCY RIGHTS ── */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Legal Tenant Rights Card */}
            <SpotlightCard className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Nepal Muluki Civil Code 2074 Tenancy Protections
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified statutory safeguards guaranteed for your tenancy
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <strong className="text-slate-900 block font-bold">35-Day Eviction Notice</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Under Section 389, landlords cannot terminate tenancy without 35 days written statutory notice.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <strong className="text-slate-900 block font-bold">Max 2-Month Deposit</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Security deposits are escrow-monitored and refundable within 14 days post-inspection.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <strong className="text-slate-900 block font-bold">Biometric Digital Seal</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Compliant with Nepal Electronic Transactions Act 2063 with cryptographic signature timestamps.
                  </p>
                </div>
              </div>
            </SpotlightCard>

            {/* Active Session & Linked Google OAuth */}
            <SpotlightCard className="p-6 sm:p-7 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Security & Active Devices</span>
              </h2>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                    <Laptop className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Current Web Session</span>
                    <span className="text-[11px] text-slate-500">
                      Logged in via Google SSO OAuth 2.0 · Active now
                    </span>
                  </div>
                </div>
                <StatusPill variant="success" size="sm">Active</StatusPill>
              </div>
            </SpotlightCard>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Session Sign Out</span>
                </h3>
                <p className="text-xs text-rose-800/80 mt-0.5">
                  Securely terminate your active session on this device.
                </p>
              </div>

              <ShimmerButton
                type="button"
                variant="danger"
                size="md"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                Sign Out of RentHub
              </ShimmerButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
