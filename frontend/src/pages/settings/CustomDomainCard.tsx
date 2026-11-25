import { Link } from 'react-router-dom';
import { CheckCircle2, Globe, Lock } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import type { CustomDomainCardProps } from './Settings.types';

export function CustomDomainCard({
  customDomain,
  branding,
  enabledByPlan,
  verifying,
  onDomainChange,
  onVerifyDomain,
}: CustomDomainCardProps) {
  const isVerified = Boolean(branding?.custom_domain && branding?.domain_verified_at);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" /> Custom Domain White-Labeling
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Serve your POS &amp; dashboard on your own domain (e.g., <code>pos.yourbusiness.ng</code>).
          </p>
        </div>

        {!enabledByPlan && (
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 shrink-0"
          >
            <Lock className="w-3 h-3" /> Enterprise
          </Link>
        )}
      </div>

      <Input
        label="Custom Domain Hostname"
        placeholder="pos.yourbusiness.ng"
        value={customDomain}
        disabled={!enabledByPlan}
        onChange={(e) => onDomainChange(e.target.value)}
      />

      {enabledByPlan && branding?.custom_domain && !isVerified && branding?.domain_verification_token && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <p className="font-bold text-slate-800">DNS Verification Required</p>
          <p className="text-slate-600">
            Add a <strong>TXT record</strong> in your domain DNS settings, then click Verify:
          </p>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] space-y-1">
            <p>
              <span className="text-slate-400">Host / Name:</span> _businessos.{branding.custom_domain}
            </p>
            <p>
              <span className="text-slate-400">TXT Value:</span> {branding.domain_verification_token}
            </p>
          </div>
          <Button type="button" variant="secondary" isLoading={verifying} onClick={onVerifyDomain}>
            Verify DNS Record
          </Button>
        </div>
      )}

      {isVerified && (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4" /> Domain Verified &amp; Active
        </div>
      )}
    </div>
  );
}
