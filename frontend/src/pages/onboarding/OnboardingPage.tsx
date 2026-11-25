import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { OnboardingBusinessPayload, RegistrationStatus, RegistrationType } from '../../core/types';
import { AuthSplitLayout } from '../../shared/layouts/AuthSplitLayout';
import { toast } from '../../shared/ui/ToastProvider';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<'retail' | 'pharmacy'>('retail');
  const [branchName, setBranchName] = useState('Main Branch');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('unregistered');
  const [registrationType, setRegistrationType] = useState<RegistrationType | ''>('');
  const [rcBnNumber, setRcBnNumber] = useState('');
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [vatRate, setVatRate] = useState('7.5');
  const [loading, setLoading] = useState(false);

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isRegistered = registrationStatus === 'registered';
    const payload: OnboardingBusinessPayload = {
      business_name: businessName.trim(),
      industry_type: industry,
      branch_name: branchName.trim(),
      branch_address: branchAddress.trim(),
      branch_phone: branchPhone.trim(),
      registration_status: registrationStatus,
      registration_type: isRegistered && registrationType ? registrationType : null,
      rc_bn_number: isRegistered && rcBnNumber.trim() ? rcBnNumber.trim() : null,
      is_vat_registered: isRegistered && isVatRegistered,
      tin_number: isRegistered && isVatRegistered ? tinNumber.trim() : null,
      default_vat_rate: isRegistered && isVatRegistered ? parseFloat(vatRate) || 7.5 : 0,
      plan_slug: 'starter',
    };

    const res = await apiFetch('/onboarding/business', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not complete onboarding.', 'Setup Error');
      return;
    }

    await refreshProfile();
    toast.success('Your 24-hour free trial is active & accounts seeded!', 'Workspace Ready');
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthSplitLayout
      title={step === 1 ? 'Set up your business' : 'Branch, CAC & Tax setup'}
      subtitle={`Step ${step} of 2 — Your 24-hour free trial & default accounts initialize automatically.`}
    >
      <div className="flex gap-2 mb-6">
        <div className="h-1.5 flex-1 rounded-full bg-brand-600" />
        <div className={`h-1.5 flex-1 rounded-full ${step === 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>

      {step === 1 ? (
        <OnboardingStep1
          businessName={businessName}
          industry={industry}
          onBusinessNameChange={setBusinessName}
          onIndustryChange={setIndustry}
          onNext={() => setStep(2)}
        />
      ) : (
        <OnboardingStep2
          branchName={branchName}
          branchAddress={branchAddress}
          branchPhone={branchPhone}
          registrationStatus={registrationStatus}
          registrationType={registrationType}
          rcBnNumber={rcBnNumber}
          isVatRegistered={isVatRegistered}
          tinNumber={tinNumber}
          vatRate={vatRate}
          loading={loading}
          onBranchNameChange={setBranchName}
          onBranchAddressChange={setBranchAddress}
          onBranchPhoneChange={setBranchPhone}
          onRegistrationStatusChange={setRegistrationStatus}
          onRegistrationTypeChange={setRegistrationType}
          onRcBnNumberChange={setRcBnNumber}
          onVatRegisteredChange={setIsVatRegistered}
          onTinNumberChange={setTinNumber}
          onVatRateChange={setVatRate}
          onBack={() => setStep(1)}
          onSubmit={handleComplete}
        />
      )}
    </AuthSplitLayout>
  );
}
