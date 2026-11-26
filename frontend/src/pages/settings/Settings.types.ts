import type { BrandingPlanControls, BusinessBranding, UpdateBrandingPayload } from '../../core/types';
export type SettingsTabKey = 'branding' | 'security' | 'billing';

export interface BrandingPreviewCardProps {
  form: UpdateBrandingPayload;
  branding: BusinessBranding | null;
  planControls: BrandingPlanControls;
}

export interface BrandIdentityFormCardProps {
  form: UpdateBrandingPayload;
  onChangeForm: (next: UpdateBrandingPayload) => void;
}


export interface CustomDomainCardProps {
  customDomain: string;
  branding: BusinessBranding | null;
  enabledByPlan: boolean;
  verifying: boolean;
  onDomainChange: (val: string) => void;
  onVerifyDomain: () => void;
}

export interface BrandingSettingsTabProps {
  businessId: string;
  businessName: string;
  isTrialing: boolean;
  branding: BusinessBranding | null;
  planControls: BrandingPlanControls;
  form: UpdateBrandingPayload;
  saving: boolean;
  verifying: boolean;
  onChangeForm: (next: UpdateBrandingPayload) => void;
  onSave: (e: React.FormEvent) => void;
  onVerifyDomain: () => void;
}

