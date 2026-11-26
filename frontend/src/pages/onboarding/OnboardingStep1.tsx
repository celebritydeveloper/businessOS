import { Palette, Pill, Shirt, ShoppingBag, Sprout, Store, Utensils } from 'lucide-react';
import type { IndustryType } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import type { OnboardingStep1Props } from './Onboarding.types';

const INDUSTRY_OPTIONS: Array<{
  id: IndustryType;
  label: string;
  subtitle: string;
  icon: typeof Store;
}> = [
  { id: 'retail', label: 'Retail Outlet', subtitle: 'Fast POS & stock tracking', icon: Store },
  { id: 'pharmacy', label: 'Pharmacy', subtitle: 'Batch, expiry & dispensing', icon: Pill },
  { id: 'supermarket', label: 'Supermarket', subtitle: 'Multi-aisle & perishable expiry', icon: ShoppingBag },
  { id: 'restaurant', label: 'Restaurant & Eatery', subtitle: 'Quick dining & portions', icon: Utensils },
  { id: 'laundry', label: 'Laundry & Dry Clean', subtitle: 'Garment care & service items', icon: Shirt },
  { id: 'agriculture', label: 'Agriculture', subtitle: 'Livestock, crop cycles & agro', icon: Sprout },
  { id: 'creative', label: 'Creative & Freelance', subtitle: 'Agency retainers & projects', icon: Palette },
];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {INDUSTRY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = industry === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onIndustryChange(opt.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selected
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 text-brand-600 mb-1.5" />
                <p className="text-xs sm:text-sm font-bold text-slate-900">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{opt.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Button type="button" fullWidth disabled={!businessName.trim()} onClick={onNext}>
        Continue to Step 2
      </Button>
    </div>
  );
}
