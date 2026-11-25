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
