import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { BrandingPlanControls, BrandingResponse, BusinessBranding, UpdateBrandingPayload } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import { BrandingPreviewCard } from './BrandingPreviewCard';
import { CustomDomainCard } from './CustomDomainCard';
import { Link } from 'react-router-dom';

export function SettingsPage() {
  const { me, activeBusiness } = useAuth();
  const isTrialing = me?.subscription?.status === 'trialing';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [planControls, setPlanControls] = useState<BrandingPlanControls>({
    show_powered_by: true,
    custom_domain_enabled: false,
  });

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
    const res = await apiFetch<{ branding: BusinessBranding }>(
      `/workspace/businesses/${activeBusiness.id}/branding/verify-domain`,
      { method: 'POST' }
    );
    setVerifying(false);

    if (!res.ok || !res.body.data) {
      toast.error(res.body.message || 'DNS verification failed.', 'Verification Pending');
      return;
    }

    setBranding(res.body.data.branding);
    toast.success('Custom domain verified and active!', 'White-Label Active');
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading business branding settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Business Settings &amp; Branding</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure receipt branding, customer support details, and custom domain white-labeling for{' '}
          <strong>{activeBusiness?.name}</strong>.
        </p>
      </div>

      {isTrialing && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-amber-900 font-medium">
            Customizing business branding is locked during your 24-hour free trial. Upgrade to a paid plan to unlock receipt &amp; app branding.
          </p>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shrink-0"
          >
            Upgrade Now
          </Link>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Brand Identity &amp; Receipt Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display / App Name"
                placeholder="Apex Pharmacy"
                value={form.app_name}
                onChange={(e) => setForm({ ...form, app_name: e.target.value })}
              />
              <Input
                label="Website URL"
                placeholder="https://apexpharmacy.ng"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Logo Image URL"
                placeholder="https://.../logo.png"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
              <Input
                label="Favicon URL (Custom Domain)"
                placeholder="https://.../favicon.ico"
                value={form.favicon_url}
                onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Primary Brand Color</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value.toUpperCase() })}
                    className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value.toUpperCase() })}
                    className="flex-1 h-11 px-3 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Secondary / Header Color</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value.toUpperCase() })}
                    className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value.toUpperCase() })}
                    className="flex-1 h-11 px-3 rounded-lg border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Support Email"
                type="email"
                placeholder="support@apexpharmacy.ng"
                value={form.support_email}
                onChange={(e) => setForm({ ...form, support_email: e.target.value })}
              />
              <Input
                label="Support Phone"
                type="tel"
                placeholder="08012345678"
                value={form.support_phone}
                onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
              />
            </div>
          </div>

          <CustomDomainCard
            customDomain={form.custom_domain || ''}
            branding={branding}
            enabledByPlan={planControls.custom_domain_enabled}
            verifying={verifying}
            onDomainChange={(val) => setForm({ ...form, custom_domain: val })}
            onVerifyDomain={handleVerifyDomain}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isTrialing} isLoading={saving}>
              Save Branding Settings
            </Button>
          </div>
        </form>

        <div>
          <BrandingPreviewCard form={form} branding={branding} planControls={planControls} />
        </div>
      </div>
    </div>
  );
}
