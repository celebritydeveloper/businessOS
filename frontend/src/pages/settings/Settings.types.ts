import type { BrandingPlanControls, BusinessBranding, UpdateBrandingPayload } from '../../core/types';

export interface BrandingPreviewCardProps {
  form: UpdateBrandingPayload;
  branding: BusinessBranding | null;
  planControls: BrandingPlanControls;
}

export interface CustomDomainCardProps {
  customDomain: string;
  branding: BusinessBranding | null;
  enabledByPlan: boolean;
  verifying: boolean;
  onDomainChange: (val: string) => void;
  onVerifyDomain: () => void;
}
