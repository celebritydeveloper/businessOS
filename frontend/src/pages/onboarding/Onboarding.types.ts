import type { IndustryType, RegistrationStatus, RegistrationType } from '../../core/types';

export interface RegistrationTypeOption {
  value: RegistrationType;
  label: string;
}

export interface OnboardingStep1Props {
  businessName: string;
  industry: IndustryType;
  onBusinessNameChange: (val: string) => void;
  onIndustryChange: (val: IndustryType) => void;
  onNext: () => void;
}

export interface OnboardingStep2Props {
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  registrationStatus: RegistrationStatus;
  registrationType: RegistrationType | '';
  rcBnNumber: string;
  isVatRegistered: boolean;
  tinNumber: string;
  vatRate: string;
  loading: boolean;
  onBranchNameChange: (val: string) => void;
  onBranchAddressChange: (val: string) => void;
  onBranchPhoneChange: (val: string) => void;
  onRegistrationStatusChange: (val: RegistrationStatus) => void;
  onRegistrationTypeChange: (val: RegistrationType | '') => void;
  onRcBnNumberChange: (val: string) => void;
  onVatRegisteredChange: (val: boolean) => void;
  onTinNumberChange: (val: string) => void;
  onVatRateChange: (val: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CAC_REGISTRATION_TYPES: RegistrationTypeOption[] = [
  { value: 'BUSINESS_NAME', label: 'Business Name' },
  { value: 'PRIVATE_LIMITED_COMPANY', label: 'Private Company Limited by Shares (Ltd)' },
  { value: 'PUBLIC_LIMITED_COMPANY', label: 'Public Company Limited by Shares (Plc)' },
  { value: 'COMPANY_LIMITED_BY_GUARANTEE', label: 'Company Limited by Guarantee' },
  { value: 'UNLIMITED_COMPANY', label: 'Unlimited Company' },
  { value: 'LIMITED_LIABILITY_PARTNERSHIP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'LIMITED_PARTNERSHIP', label: 'Limited Partnership (LP)' },
  { value: 'INCORPORATED_TRUSTEES', label: 'Incorporated Trustees' },
];
