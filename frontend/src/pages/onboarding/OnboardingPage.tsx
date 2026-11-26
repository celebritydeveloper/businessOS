import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { IndustryType, OnboardingBusinessPayload, RegistrationStatus, RegistrationType } from '../../core/types';
import { AuthSplitLayout } from '../../shared/layouts/AuthSplitLayout';
import { toast } from '../../shared/ui/ToastProvider';
import { OnboardingStep1 } from './OnboardingStep1';
import { OnboardingStep2 } from './OnboardingStep2';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { me, refreshProfile } = useAuth();

  const isAdditional = searchParams.get('mode') === 'new' && (me?.businesses.length ?? 0) > 0;

  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<IndustryType>('retail');
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

    const endpoint = isAdditional ? '/workspace/businesses' : '/onboarding/business';
    const res = await apiFetch<{ business_id: string; branch_id: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not complete business setup.', 'Setup Error');
      return;
    }

    if (res.body.data?.business_id && res.body.data?.branch_id) {
      localStorage.setItem('bos_active_business_id', res.body.data.business_id);
      localStorage.setItem('bos_active_branch_id', res.body.data.branch_id);
    }

    await refreshProfile();
    toast.success(
      isAdditional
        ? `Business "${businessName}" created & seeded!`
        : 'Your 24-hour free trial is active & accounts seeded!',
      'Workspace Ready'
    );
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthSplitLayout
      title={
        step === 1
          ? isAdditional
            ? 'Add a new business'
            : 'Set up your business'
          : 'Branch, CAC & Tax setup'
      }
      subtitle={
        isAdditional
          ? `Step ${step} of 2 — Default categories, Chart of Accounts & roles will be seeded automatically.`
          : `Step ${step} of 2 — Your 24-hour free trial & default accounts initialize automatically.`
      }
    >
      {isAdditional && (
        <div className="mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      )}

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
