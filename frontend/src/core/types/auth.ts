import type { IndustryType, RegistrationStatus, RegistrationType } from './tenancy';

export interface RegisterPayload {
  owner_name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  session_id: string;
  next_step?: 'verify_email' | 'onboarding';
}

export interface OnboardingBusinessPayload {
  business_name: string;
  industry_type: IndustryType;
  branch_name: string;
  branch_address?: string;
  branch_phone?: string;
  registration_status: RegistrationStatus;
  registration_type?: RegistrationType | null;
  rc_bn_number?: string | null;
  is_vat_registered: boolean;
  tin_number?: string | null;
  default_vat_rate: number;
  plan_slug: string;
}
