export interface BusinessBranding {
  id: string;
  business_id: string;
  app_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  support_email: string | null;
  support_phone: string | null;
  website: string | null;
  custom_domain: string | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandingPlanControls {
  show_powered_by: boolean;
  custom_domain_enabled: boolean;
}

export interface BrandingResponse {
  branding: BusinessBranding;
  plan_controls: BrandingPlanControls;
}

export interface UpdateBrandingPayload {
  app_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  support_email: string;
  support_phone: string;
  website: string;
  custom_domain?: string;
}
