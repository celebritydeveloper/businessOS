import { Link } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';
import { BrandIdentityFormCard } from './BrandIdentityFormCard';
import { BrandingPreviewCard } from './BrandingPreviewCard';
import { CustomDomainCard } from './CustomDomainCard';
import type { BrandingSettingsTabProps } from './Settings.types';

export function BrandingSettingsTab({
  isTrialing,
  branding,
  planControls,
  form,
  saving,
  verifying,
  onChangeForm,
  onSave,
  onVerifyDomain,
}: BrandingSettingsTabProps) {
  return (
    <div className="space-y-6">
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
        <form onSubmit={onSave} className="lg:col-span-2 space-y-5">
          
          <BrandIdentityFormCard
            form={form} onChangeForm={onChangeForm}
          />

          <CustomDomainCard
            customDomain={form.custom_domain || ''}
            branding={branding}
            enabledByPlan={planControls.custom_domain_enabled}
            verifying={verifying}
            onDomainChange={(val) => onChangeForm({ ...form, custom_domain: val })}
            onVerifyDomain={onVerifyDomain}
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
