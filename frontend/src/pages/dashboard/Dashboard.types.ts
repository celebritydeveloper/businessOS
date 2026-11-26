import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColorClass?: string;
}

export interface QuickActionCardProps {
  title: string;
  description: string;
  to: string;
}


export interface DashboardKpis {
  today_revenue: number;
  today_orders: number;
  month_revenue: number;
  low_stock_count: number;
  expiring_count: number;
  catalog_count: number
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface PaymentMixItem {
  method: 'cash' | 'pos_card' | 'transfer';
  total: number | string;
}

export interface RecentSaleSummary {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  grand_total: number | string;
  sold_at: string;
  cashier_name: string | null;
}

export interface DashboardOverviewResponse {
  kpis: DashboardKpis;
  daily_trend: DailyTrendPoint[];
  payment_mix: PaymentMixItem[];
  recent_sales: RecentSaleSummary[];
}
