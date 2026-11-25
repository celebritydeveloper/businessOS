import { CheckCircle2, Globe, Mail, Phone } from 'lucide-react';
import type { BrandingPreviewCardProps } from './Settings.types';

export function BrandingPreviewCard({ form, branding, planControls }: BrandingPreviewCardProps) {
  const displayName = form.app_name.trim() || 'Your Business Name';
  const isDomainVerified = Boolean(branding?.custom_domain && branding?.domain_verified_at);

  return (
    <div className="space-y-4">
      {/* Surface 1: Customer Receipt & Invoice Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Receipt &amp; Invoice Preview
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            Active on all plans
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div
            style={{ backgroundColor: form.secondary_color || '#0F172A' }}
            className="px-4 py-4 text-white flex items-center gap-3"
          >
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={displayName}
                className="w-10 h-10 rounded-lg object-cover bg-white p-0.5 shrink-0"
              />
            ) : (
              <div
                style={{ backgroundColor: form.primary_color || '#0F4EF0' }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
              >
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              {form.website && (
                <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {form.website}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Receipt #BOS-1042</span>
              <span className="font-semibold text-slate-900">₦14,500.00</span>
            </div>
            {(form.support_phone || form.support_email) && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-3 text-[11px] text-slate-500">
                {form.support_phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {form.support_phone}
                  </span>
                )}
                {form.support_email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {form.support_email}
                  </span>
                )}
              </div>
            )}

            {planControls.show_powered_by && (
              <p className="pt-2 text-center text-[10px] font-semibold text-slate-400">
                Powered by BusinessOS
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Surface 2: App Shell White-Label Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
        <p className="text-xs font-bold text-slate-900">App Shell &amp; Login White-Labeling</p>
        {isDomainVerified ? (
          <p className="text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Active on <strong>{branding?.custom_domain}</strong> (favicon, login &amp; theme applied)
          </p>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Currently using default <strong>BusinessOS</strong> app shell &amp; favicon. Connect and verify a custom domain on Enterprise to white-label the full app experience.
          </p>
        )}
      </div>
    </div>
  );
}
