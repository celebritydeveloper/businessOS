import { Pill, Store } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import type { OnboardingStep1Props } from './Onboarding.types';

export function OnboardingStep1({
  businessName,
  industry,
  onBusinessNameChange,
  onIndustryChange,
  onNext,
}: OnboardingStep1Props) {
  return (
    <div className="space-y-5 mt-4">
      <Input
        label="Business Name"
        placeholder="e.g., Apex Pharmacy & Stores"
        value={businessName}
        onChange={(e) => onBusinessNameChange(e.target.value)}
        required
      />

      <div className="space-y-2">
        <span className="block text-xs font-semibold text-slate-700">Select Primary Industry</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onIndustryChange('retail')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              industry === 'retail'
                ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Store className="w-5 h-5 text-brand-600 mb-2" />
            <p className="text-sm font-bold text-slate-900">Retail Outlet</p>
            <p className="text-xs text-slate-500 mt-0.5">Fast POS &amp; stock tracking</p>
          </button>

          <button
            type="button"
            onClick={() => onIndustryChange('pharmacy')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              industry === 'pharmacy'
                ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Pill className="w-5 h-5 text-brand-600 mb-2" />
            <p className="text-sm font-bold text-slate-900">Pharmacy</p>
            <p className="text-xs text-slate-500 mt-0.5">Batch, expiry &amp; dispensing</p>
          </button>
        </div>
      </div>

      <Button type="button" fullWidth disabled={!businessName.trim()} onClick={onNext}>
        Continue to Step 2
      </Button>
    </div>
  );
}
