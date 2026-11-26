export type FarmCycleType = 'livestock' | 'crop';
export type FarmCycleStatus = 'active' | 'harvested' | 'closed';
export type FarmCycleLogType = 'milestone' | 'feed_input' | 'mortality' | 'vaccination' | 'harvest' | 'partial_harvest';
export type FarmInputCategory = 'feed' | 'seed' | 'fertilizer' | 'vaccine_drug' | 'other';

export interface FarmInputItem {
  id: string;
  name: string;
  category: FarmInputCategory;
  unit_label: string;
  quantity_on_hand: number | string;
  reorder_level: number | string;
  unit_cost: number | string;
}

export interface FarmCycleLogItem {
  id: string;
  cycle_id: string;
  log_type: FarmCycleLogType;
  title: string;
  catalog_item_id: string | null;
  item_name: string | null;
  quantity: number | string;
  cost_amount: number | string;
  log_date: string;
  notes: string | null;
  actor_name: string | null;
}

export interface FarmCycleItem {
  id: string;
  cycle_type: FarmCycleType;
  name: string;
  species_or_crop: string;
  initial_quantity: number | string;
  current_quantity: number | string;
  unit_label: string;
  initial_cost: number | string;
  accumulated_cost: number | string;
  start_date: string;
  expected_harvest_date: string;
  actual_harvest_date: string | null;
  status: FarmCycleStatus;
  notes: string | null;
  logs: FarmCycleLogItem[];
}
