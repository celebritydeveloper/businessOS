import type { IndustryType } from '../types';

export interface IndustryCapabilityConfig {
  supportsBatchExpiry: boolean;
  supportsFarmCycles: boolean;
  supportsProjects: boolean;
  defaultItemType: 'product' | 'service';
  defaultUnitLabel: string;
  defaultVatExempt: boolean;
}

const CAPABILITIES: Record<IndustryType, IndustryCapabilityConfig> = {
  pharmacy: {
    supportsBatchExpiry: true,
    supportsFarmCycles: false,
    supportsProjects: false,
    defaultItemType: 'product',
    defaultUnitLabel: 'Bag',
    defaultVatExempt: true,
  },
  supermarket: {
    supportsBatchExpiry: true,
    supportsFarmCycles: false,
    supportsProjects: false,
    defaultItemType: 'product',
    defaultUnitLabel: 'Piece',
    defaultVatExempt: false,
  },
  retail: {
    supportsBatchExpiry: false,
    supportsFarmCycles: false,
    supportsProjects: false,
    defaultItemType: 'product',
    defaultUnitLabel: 'Piece',
    defaultVatExempt: false,
  },
  restaurant: {
    supportsBatchExpiry: false,
    supportsFarmCycles: false,
    supportsProjects: false,
    defaultItemType: 'product',
    defaultUnitLabel: 'Plate',
    defaultVatExempt: false,
  },
  laundry: {
    supportsBatchExpiry: false,
    supportsFarmCycles: false,
    supportsProjects: false,
    defaultItemType: 'service',
    defaultUnitLabel: 'Item',
    defaultVatExempt: false,
  },
  agriculture: {
    supportsBatchExpiry: true,
    supportsFarmCycles: true,
    defaultItemType: 'product',
    supportsProjects: false,
    defaultUnitLabel: 'Bag',
    defaultVatExempt: true,
  },
  creative: {
    supportsBatchExpiry: false,
    supportsFarmCycles: false,
    supportsProjects: true,
    defaultItemType: 'service',
    defaultUnitLabel: 'Project',
    defaultVatExempt: false,
  },
};


export function getIndustryCapabilities(industry?: IndustryType): IndustryCapabilityConfig {
  if (!industry || !CAPABILITIES[industry]) {
    return CAPABILITIES.retail;
  }
  return CAPABILITIES[industry];
}
