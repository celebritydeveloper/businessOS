import { useEffect, useState, type FormEvent } from 'react';
import { CreditCard, Lock, Palette } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { BrandingPlanControls, BrandingResponse, BusinessBranding, UpdateBrandingPayload } from '../../core/types';
import { toast } from '../../shared/ui/ToastProvider';
import { BillingManagementPage } from '../billing/BillingManagementPage';
import { BrandingSettingsTab } from './BrandingSettingsTab';
import { MySecurityCard } from './MySecurityCard';
import type { SettingsTabKey } from './Settings.types';

export function SettingsPage() {
  const { me, activeBusiness } = useAuth();
  const isOwner = Boolean(me?.user.is_owner);
  const isTrialing = me?.subscription?.status === 'trialing';

  const [activeTab, setActiveTab] = useState<SettingsTabKey>(isOwner ? 'branding' : 'security');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [planControls, setPlanControls] = useState<BrandingPlanControls>({ show_powered_by: true, custom_domain_enabled: false });
  const [form, setForm] = useState<UpdateBrandingPayload>({
    app_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#0F4EF0',
    secondary_color: '#0F172A',
    support_email: '',
    support_phone: '',
    website: '',
    custom_domain: '',
  });

  useEffect(() => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    void (async () => {
      const res = await apiFetch<BrandingResponse>(`/workspace/businesses/${activeBusiness.id}/branding`);
      if (res.ok && res.body.data) {
        const b = res.body.data.branding;
        setBranding(b);
        setPlanControls(res.body.data.plan_controls);
        setForm({
          app_name: b.app_name || activeBusiness.name,
          logo_url: b.logo_url || '',
          favicon_url: b.favicon_url || '',
          primary_color: b.primary_color || '#0F4EF0',
          secondary_color: b.secondary_color || '#0F172A',
          support_email: b.support_email || '',
          support_phone: b.support_phone || '',
          website: b.website || '',
          custom_domain: b.custom_domain || '',
        });
      }
      setLoading(false);
    })();
  }, [activeBusiness?.id, activeBusiness?.name]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeBusiness?.id) return;
    setSaving(true);
    const res = await apiFetch<{ branding: BusinessBranding }>(`/workspace/businesses/${activeBusiness.id}/branding`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'Could not update branding.', 'Save Failed');
      return;
    }
    setBranding(res.body.data.branding);
    toast.success('Business branding updated successfully.', 'Saved');
  };

  const handleVerifyDomain = async () => {
    if (!activeBusiness?.id) return;
    setVerifying(true);
    const res = await apiFetch<{ branding: BusinessBranding }>(`/workspace/businesses/${activeBusiness.id}/branding/verify-domain`, { method: 'POST' });
    setVerifying(false);
    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'DNS verification failed.', 'Verification Pending');
      return;
    }
    setBranding(res.body.data.branding);
    toast.success('Custom domain verified and active!', 'White-Label Active');
  };

  if (!activeBusiness) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Workspace &amp; Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage branding, personal login credentials, and subscription billing for <strong>{activeBusiness.name}</strong>.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'branding' ? 'bg-brand-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Branding &amp; White-Label
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            activeTab === 'security' ? 'bg-brand-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> My Security (Password &amp; PIN)
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'billing' ? 'bg-brand-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Billing &amp; Plan
          </button>
        )}
      </div>

      {activeTab === 'branding' && isOwner && (
        loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading branding settings...</div>
        ) : (
          <BrandingSettingsTab
            businessId={activeBusiness.id}
            businessName={activeBusiness.name}
            isTrialing={isTrialing}
            branding={branding}
            planControls={planControls}
            form={form}
            saving={saving}
            verifying={verifying}
            onChangeForm={setForm}
            onSave={(e) => void handleSave(e)}
            onVerifyDomain={() => void handleVerifyDomain()}
          />
        )
      )}

      {activeTab === 'security' && <MySecurityCard />}

      {activeTab === 'billing' && isOwner && <BillingManagementPage />}
    </div>
  );
}
