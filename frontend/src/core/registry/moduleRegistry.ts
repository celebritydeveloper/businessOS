import type { ReactNode } from 'react';

export type IndustryType = 'retail' | 'pharmacy' | 'supermarket' | 'laundry' | 'restaurant' | 'agriculture';

export interface IndustryNavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
}

export interface IndustryModuleDefinition {
  industry: IndustryType;
  displayName: string;
  navItems: IndustryNavItem[];
  renderPosItemBadge?: (meta: Record<string, unknown>) => ReactNode;
  renderReceiptExtra?: (saleMeta: Record<string, unknown>) => ReactNode;
}

class ModuleRegistry {
  private modules = new Map<IndustryType, IndustryModuleDefinition>();

  register(definition: IndustryModuleDefinition): void {
    this.modules.set(definition.industry, definition);
  }

  get(industry: IndustryType): IndustryModuleDefinition | undefined {
    return this.modules.get(industry);
  }

  getAll(): IndustryModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}

export const moduleRegistry = new ModuleRegistry();
