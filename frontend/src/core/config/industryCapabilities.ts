import type { IndustryType } from '../types';

export interface IndustryCapabilityConfig {
  supportsBatchExpiry: boolean;
  defaultUnitLabel: string;
  defaultVatExempt: boolean;
}

const CAPABILITIES: Record<IndustryType, IndustryCapabilityConfig> = {
  pharmacy: {
    supportsBatchExpiry: true,
    defaultUnitLabel: 'Pack',
    defaultVatExempt: true,
  },
  supermarket: {
    supportsBatchExpiry: true,
    defaultUnitLabel: 'Piece',
    defaultVatExempt: false,
  },
  retail: {
    supportsBatchExpiry: false,
    defaultUnitLabel: 'Piece',
    defaultVatExempt: false,
  },
  restaurant: {
    supportsBatchExpiry: false,
    defaultUnitLabel: 'Plate',
    defaultVatExempt: false,
  },
  laundry: {
    supportsBatchExpiry: false,
    defaultUnitLabel: 'Item',
    defaultVatExempt: false,
  },
  farm: {
    supportsBatchExpiry: true,
    defaultUnitLabel: 'Bag',
    defaultVatExempt: true,
  },
};

export function getIndustryCapabilities(industry?: IndustryType): IndustryCapabilityConfig {
  if (!industry || !CAPABILITIES[industry]) {
    return CAPABILITIES.retail;
  }
  return CAPABILITIES[industry];
}
