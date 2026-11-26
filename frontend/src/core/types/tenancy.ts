export type IndustryType = 'retail' | 'pharmacy' | 'supermarket' | 'laundry' | 'restaurant' | 'agriculture' | 'creative';

export type RegistrationStatus = 'unregistered' | 'registered';

export type RegistrationType =
  | 'BUSINESS_NAME'
  | 'PRIVATE_LIMITED_COMPANY'
  | 'PUBLIC_LIMITED_COMPANY'
  | 'COMPANY_LIMITED_BY_GUARANTEE'
  | 'UNLIMITED_COMPANY'
  | 'LIMITED_LIABILITY_PARTNERSHIP'
  | 'LIMITED_PARTNERSHIP'
  | 'INCORPORATED_TRUSTEES';

export type StaffRole = 'manager' | 'cashier' | 'pharmacist' | 'inventory_clerk';

export type SubscriptionStatus = 'pending_payment' | 'trialing' | 'active' | 'past_due' | 'cancelled';

export interface Account {
  id: string;
  owner_name: string;
  email: string;
  phone: string | null;
  has_used_trial: boolean;
  status: 'active' | 'suspended';
}

export interface UserProfile {
  id: string;
  account_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_owner: boolean;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  receipt_footer?: string | null;
  is_active?: boolean;
  permissions?: string[];
}

export interface Business {
  id: string;
  account_id?: string;
  name: string;
  industry_type: IndustryType;
  registration_status: RegistrationStatus;
  registration_type?: RegistrationType | null;
  rc_bn_number?: string | null;
  is_vat_registered: boolean;
  default_vat_rate: number;
  currency?: string;
  branches: Branch[];
}

export interface PlanLimits {
  max_businesses: number;
  max_branches: number;
  max_staff_users: number;
  max_catalog_items: number;
  offline_sync_enabled: boolean;
  batch_expiry_tracking: boolean;
  realtime_updates: boolean;
  advanced_reports: boolean;
  show_powered_by?: boolean;
  custom_domain_enabled?: boolean;
}


export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  trial_hours: number;
  limits: PlanLimits;
}

export interface Subscription {
  id?: string;
  status: SubscriptionStatus;
  billing_cycle?: 'monthly' | 'yearly';
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  grace_until?: string | null;
  plan_slug?: string;
}

export interface MePayload {
  user: UserProfile;
  businesses: Business[];
  subscription: Subscription | null;
}


