import { Building2, ShieldCheck } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { CAC_REGISTRATION_TYPES, type OnboardingStep2Props } from './Onboarding.types';

export function OnboardingStep2({
  branchName,
  branchAddress,
  branchPhone,
  registrationStatus,
  registrationType,
  rcBnNumber,
  isVatRegistered,
  tinNumber,
  vatRate,
  loading,
  onBranchNameChange,
  onBranchAddressChange,
  onBranchPhoneChange,
  onRegistrationStatusChange,
  onRegistrationTypeChange,
  onRcBnNumberChange,
  onVatRegisteredChange,
  onTinNumberChange,
  onVatRateChange,
  onBack,
  onSubmit,
}: OnboardingStep2Props) {
  const isRegistered = registrationStatus === 'registered';
  const canSubmit =
    branchName.trim().length > 0 &&
    (!isRegistered || registrationType !== '') &&
    (!isVatRegistered || tinNumber.trim().length > 0);

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <Input
        label="First Branch Name"
        placeholder="e.g., Biogbolo Main Branch"
        value={branchName}
        onChange={(e) => onBranchNameChange(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Input
          label="Branch Address"
          placeholder="Street, City"
          value={branchAddress}
          onChange={(e) => onBranchAddressChange(e.target.value)}
        />
        <Input
          label="Branch Phone"
          placeholder="08012345678"
          value={branchPhone}
          onChange={(e) => onBranchPhoneChange(e.target.value)}
        />
      </div>

      {/* CAC Business Registration Section */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-brand-600" /> CAC Business Registration
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                onRegistrationStatusChange('unregistered');
                onRegistrationTypeChange('');
                onVatRegisteredChange(false);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                !isRegistered ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unregistered
            </button>
            <button
              type="button"
              onClick={() => onRegistrationStatusChange('registered')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                isRegistered ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registered
            </button>
          </div>
        </div>

        {!isRegistered ? (
          <p className="text-[11px] text-slate-500">
            Unregistered businesses operate in <strong>0% VAT-Exempt mode</strong> until CAC registration is completed.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="cac-reg-type" className="block text-xs font-semibold text-slate-700">
                Type of CAC Registration
              </label>
              <select
                id="cac-reg-type"
                value={registrationType}
                onChange={(e) => onRegistrationTypeChange(e.target.value as typeof registrationType)}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                required
              >
                <option value="">Select registration type...</option>
                {CAC_REGISTRATION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="RC / BN Number (Optional — can add later)"
              placeholder="e.g., RC-1234567 or BN-3456789"
              value={rcBnNumber}
              onChange={(e) => onRcBnNumberChange(e.target.value)}
            />

            {/* Tax / VAT Compliance Section (Unlocked for CAC Registered Businesses) */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">VAT-Registered with FIRS?</p>
                    <p className="text-[11px] text-slate-500">Enable only if qualified to collect VAT</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isVatRegistered}
                  onChange={(e) => onVatRegisteredChange(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                />
              </label>

              {isVatRegistered && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="FIRS TIN / VAT ID"
                    placeholder="12345678-0001"
                    value={tinNumber}
                    onChange={(e) => onTinNumberChange(e.target.value)}
                    required
                  />
                  <Input
                    label="VAT Rate (%)"
                    type="number"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => onVatRateChange(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" fullWidth isLoading={loading} disabled={!canSubmit}>
          Launch Workspace
        </Button>
      </div>
    </form>
  );
}
