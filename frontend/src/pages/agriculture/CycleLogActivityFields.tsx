import { Input } from '../../shared/ui/Input';
import type { FarmCycleLogType, FarmInputItem } from './Agriculture.types';

interface CycleLogActivityFieldsProps {
  logType: FarmCycleLogType;
  cycleUnitLabel: string;
  farmInputs: FarmInputItem[];
  farmInputId: string;
  quantity: string;
  costAmount: string;
  title: string;
  notes: string;
  unallocatedCost: number;
  onFarmInputChange: (val: string) => void;
  onQuantityChange: (val: string) => void;
  onCostChange: (val: string) => void;
  onTitleChange: (val: string) => void;
  onNotesChange: (val: string) => void;
}

export function CycleLogActivityFields({
  logType,
  cycleUnitLabel,
  farmInputs,
  farmInputId,
  quantity,
  costAmount,
  title,
  notes,
  unallocatedCost,
  onFarmInputChange,
  onQuantityChange,
  onCostChange,
  onTitleChange,
  onNotesChange,
}: CycleLogActivityFieldsProps) {
  const isHarvest = logType === 'partial_harvest' || logType === 'harvest';
  const showCostInput = logType !== 'mortality' && logType !== 'harvest';

  return (
    <>
      {logType === 'feed_input' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Select Input from Farm Input Store
          </label>
          <select
            value={farmInputId}
            onChange={(e) => onFarmInputChange(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
            required
          >
            <option value="">-- Select Farm Input --</option>
            {farmInputs.map((inp) => (
              <option key={inp.id} value={inp.id}>
                {inp.name} ({Number(inp.quantity_on_hand || 0)} {inp.unit_label} available)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={`grid ${showCostInput ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        <Input
          label={isHarvest ? 'Harvested Yield Qty' : `Quantity (${cycleUnitLabel} / Units)`}
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          required={['feed_input', 'mortality', 'partial_harvest', 'harvest'].includes(logType)}
        />
        {showCostInput && (
          <div className="space-y-1">
            <Input
              label={
                logType === 'partial_harvest'
                  ? 'Production Cost Assigned (₦)'
                  : 'Direct Cost (₦ Opt.)'
              }
              type="number"
              step="0.01"
              placeholder={
                logType === 'partial_harvest'
                  ? String(Math.round(unallocatedCost))
                  : 'Auto from unit cost'
              }
              value={costAmount}
              onChange={(e) => onCostChange(e.target.value)}
            />
            {logType === 'partial_harvest' && (
              <p className="text-[11px] text-slate-500">
                Auto-filled from unallocated cycle expenses (₦{Math.round(unallocatedCost).toLocaleString('en-NG')}). Edit only if spreading upfront costs across future harvests.
              </p>
            )}
          </div>
        )}
      </div>

      <Input
        label="Summary Title (Optional)"
        placeholder={logType === 'vaccination' ? 'e.g., Day 14 Gumboro Booster' : 'Auto-generated if left blank'}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <Input label="Notes (Optional)" value={notes} onChange={(e) => onNotesChange(e.target.value)} />
    </>
  );
}
