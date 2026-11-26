import { useState, type FormEvent } from 'react';
import { ClipboardPlus, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { CatalogItem } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { FarmCycleItem, FarmCycleLogType, FarmInputItem } from './Agriculture.types';
import { CycleLogActivityFields } from './CycleLogActivityFields';
import { HarvestDestinationFields } from './HarvestDestinationFields';

interface CycleLogModalProps {
  cycle: FarmCycleItem | null;
  businessId: string;
  branchId: string;
  catalogItems: CatalogItem[];
  farmInputs: FarmInputItem[];
  onClose: () => void;
  onSaved: () => void;
}

export function CycleLogModal({
  cycle,
  businessId,
  branchId,
  catalogItems,
  farmInputs,
  onClose,
  onSaved,
}: CycleLogModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [logType, setLogType] = useState<FarmCycleLogType>('feed_input');
  const [farmInputId, setFarmInputId] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [createNewProduct, setCreateNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('Crate');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('21');
  const [quantity, setQuantity] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [title, setTitle] = useState('');
  const [logDate, setLogDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!cycle) return null;

  const productItems = catalogItems.filter((i) => i.item_type === 'product');
  const isHarvestType = logType === 'partial_harvest' || logType === 'harvest';
  const unallocatedCost = Math.max(
    0,
    Number(cycle.accumulated_cost || 0) - Number((cycle as { allocated_cost?: number }).allocated_cost || 0)
  );
  const parsedQty = parseFloat(quantity) || 0;
  const parsedDirectCost = parseFloat(costAmount) || 0;
  const effectivePool = logType === 'harvest' ? unallocatedCost : parsedDirectCost || unallocatedCost;
  const previewUnitCost = parsedQty > 0 ? effectivePool / parsedQty : 0;

  const handleLogTypeChange = (nextType: FarmCycleLogType) => {
    setLogType(nextType);
    if (nextType === 'partial_harvest') {
      setCostAmount(unallocatedCost > 0 ? String(Math.round(unallocatedCost)) : '0');
    } else {
      setCostAmount('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(
      `/workspace/businesses/${businessId}/branches/${branchId}/farm-cycles/${cycle.id}/logs`,
      {
        method: 'POST',
        body: JSON.stringify({
          log_type: logType,
          farm_input_id: logType === 'feed_input' ? farmInputId : '',
          catalog_item_id: isHarvestType && !createNewProduct ? catalogItemId : '',
          create_new_product: isHarvestType && createNewProduct,
          new_product_name: newProductName.trim(),
          new_product_unit: newProductUnit,
          new_product_price: parseFloat(newProductPrice) || 0,
          shelf_life_days: parseInt(shelfLifeDays, 10) || 21,
          quantity: parsedQty,
          cost_amount: logType === 'harvest' ? 0 : parsedDirectCost,
          title: title.trim(),
          log_date: logDate,
          notes: notes.trim(),
        }),
      }
    );
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not record cycle activity.', 'Error');
      return;
    }

    toast.success(
      isHarvestType ? 'Harvest batch auto-generated & added to POS Storefront!' : 'Activity added to timeline.',
      'Saved'
    );
    setQuantity('');
    setCostAmount('');
    setTitle('');
    setNotes('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <ClipboardPlus className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Log Cycle Activity</h2>
              <p className="text-xs text-slate-500">{cycle.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Activity Type</label>
              <select
                value={logType}
                onChange={(e) => handleLogTypeChange(e.target.value as FarmCycleLogType)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="feed_input">Feed / Input Usage (From Barn)</option>
                <option value="mortality">Mortality / Crop Loss</option>
                <option value="vaccination">Vaccination / Treatment</option>
                <option value="milestone">Stage Milestone</option>
                <option value="partial_harvest">Ongoing Harvest (Keep Cycle Active)</option>
                <option value="harvest">Final Harvest (Close Cycle → Store)</option>
              </select>
            </div>
            <Input label="Date" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
          </div>

          {isHarvestType && (
            <HarvestDestinationFields
              productItems={productItems}
              catalogItemId={catalogItemId}
              createNewProduct={createNewProduct}
              newProductName={newProductName}
              newProductUnit={newProductUnit}
              newProductPrice={newProductPrice}
              shelfLifeDays={shelfLifeDays}
              previewUnitCost={previewUnitCost}
              onCatalogItemChange={setCatalogItemId}
              onToggleCreateNew={() => setCreateNewProduct((p) => !p)}
              onNewNameChange={setNewProductName}
              onNewUnitChange={setNewProductUnit}
              onNewPriceChange={setNewProductPrice}
              onShelfLifeChange={setShelfLifeDays}
            />
          )}

          <CycleLogActivityFields
            logType={logType}
            cycleUnitLabel={cycle.unit_label}
            farmInputs={farmInputs}
            farmInputId={farmInputId}
            quantity={quantity}
            costAmount={costAmount}
            title={title}
            notes={notes}
            unallocatedCost={unallocatedCost}
            onFarmInputChange={setFarmInputId}
            onQuantityChange={setQuantity}
            onCostChange={setCostAmount}
            onTitleChange={setTitle}
            onNotesChange={setNotes}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>
              {logType === 'harvest'
                ? 'Complete Final Harvest' : logType === 'partial_harvest' ? 'Generate Batch & Add to Store' : 'Save Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
