import type { PlanLimits, Subscription, SubscriptionPlan } from '../../core/types';


export interface PlansApiResponse {
  plans: SubscriptionPlan[];
}

export type BillingCycle = 'monthly' | 'yearly';

export type PaymentGateway = 'paystack' | 'flutterwave';

export interface PlansApiResponse {
  plans: SubscriptionPlan[];
}

export interface InitializeCheckoutPayload {
  plan_slug: string;
  billing_cycle: BillingCycle;
  gateway: PaymentGateway;
  callback_url: string;
}

export interface InitializeCheckoutResponse {
  authorization_url: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  status: string;
}

export interface PlanCardProps {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  currentSubscription: Subscription | null;
  processingSlug: string | null;
  onSelectPlan: (planSlug: string) => void;
}


export interface SavedPaymentMethod {
  gateway: PaymentGateway;
  brand: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  bank: string;
}

export interface BillingInvoice {
  id: string;
  reference: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paid_at: string | null;
  created_at: string;
}

export interface BillingSubscriptionDetail extends Subscription {
  plan_name?: string;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
  gateway?: string | null;
  limits?: PlanLimits;
}

export interface BillingOverviewResponse {
  subscription: BillingSubscriptionDetail | null;
  payment_method: SavedPaymentMethod | null;
  invoices: BillingInvoice[];
}


export interface PlanCardProps {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  currentSubscription: Subscription | null;
  processingSlug: string | null;
  onSelectPlan: (planSlug: string) => void;
}

export interface CurrentPlanBannerProps {
  subscription: BillingSubscriptionDetail | null;
}

export interface PaymentMethodCardProps {
  paymentMethod: SavedPaymentMethod | null;
}

export interface PlanQuotasCardProps {
  limits?: PlanLimits;
}

export interface InvoiceHistoryTableProps {
  invoices: BillingInvoice[];
}