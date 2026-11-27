export type ProjectStage = 'brief' | 'in_progress' | 'client_review' | 'revisions' | 'delivered';
export type ProjectType = 'fixed_project' | 'monthly_retainer';
export type ProjectLogType = 'deliverable' | 'time_log' | 'expense' | 'revision' | 'retainer_renewal' | 'payment';

export interface CreativeProjectLog {
  id: string;
  project_id: string;
  log_type: ProjectLogType;
  title: string;
  hours_spent: number | string;
  cost_amount: number | string;
  is_completed: number | boolean;
  created_at: string;
}

export interface CreativeProjectItem {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  title: string;
  project_type: ProjectType;
  stage: ProjectStage;
  public_token?: string | null;
  delivery_url?: string | null;
  contract_amount: number | string;
  amount_billed: number | string;
  amount_paid: number | string;
  direct_cost: number | string;
  revisions_included: number;
  revisions_used: number;
  total_hours_logged: number | string;
  due_date: string | null;
  billing_cycle_label: string | null;
  notes: string | null;
  logs: CreativeProjectLog[];
}


export interface PublicClientProject {
  id: string;
  title: string;
  project_type: ProjectType;
  delivery_url?: string | null;
  stage: ProjectStage;
  contract_amount: number | string;
  amount_billed: number | string;
  amount_paid: number | string;
  revisions_included: number;
  revisions_used: number;
  due_date: string | null;
  billing_cycle_label: string | null;
  notes: string | null;
  updated_at: string;
  customer_name: string | null;
  business_name: string;
  app_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  logs: CreativeProjectLog[];
}
