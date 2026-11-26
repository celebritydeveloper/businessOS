import type { CatalogItem } from '../../core/types';
import { Input } from '../../shared/ui/Input';

interface HarvestDestinationFieldsProps {
  productItems: CatalogItem[];
  catalogItemId: string;
  createNewProduct: boolean;
  newProductName: string;
  newProductUnit: string;
  newProductPrice: string;
  shelfLifeDays: string;
  previewUnitCost: number;
  onCatalogItemChange: (val: string) => void;
  onToggleCreateNew: () => void;
  onNewNameChange: (val: string) => void;
  onNewUnitChange: (val: string) => void;
  onNewPriceChange: (val: string) => void;
  onShelfLifeChange: (val: string) => void;
}

export function HarvestDestinationFields({
  productItems,
  catalogItemId,
  createNewProduct,
  newProductName,
  newProductUnit,
  newProductPrice,
  shelfLifeDays,
  previewUnitCost,
  onCatalogItemChange,
  onToggleCreateNew,
  onNewNameChange,
  onNewUnitChange,
  onNewPriceChange,
  onShelfLifeChange,
}: HarvestDestinationFieldsProps) {
  return (
    <div className="space-y-3 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-950">POS Storefront Destination</span>
        <button
          type="button"
          onClick={onToggleCreateNew}
          className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer"
        >
          {createNewProduct ? 'Pick Existing Product' : '+ Create New Store Product'}
        </button>
      </div>

      {createNewProduct ? (
        <div className="space-y-2.5">
          <Input
            label="New POS Product Name"
            placeholder="e.g., Farm Fresh Eggs (Crate)"
            value={newProductName}
            onChange={(e) => onNewNameChange(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Sell Unit</label>
              <select
                value={newProductUnit}
                onChange={(e) => onNewUnitChange(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="Crate">Crate</option>
                <option value="Bird">Bird</option>
                <option value="Kg">Kg</option>
                <option value="Bag">Bag</option>
                <option value="Basket">Basket</option>
                <option value="Piece">Piece</option>
              </select>
            </div>
            <Input
              label="POS Selling Price (₦)"
              type="number"
              step="0.01"
              placeholder="4800"
              value={newProductPrice}
              onChange={(e) => onNewPriceChange(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <select
          value={catalogItemId}
          onChange={(e) => onCatalogItemChange(e.target.value)}
          className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
          required
        >
          <option value="">-- Select Existing POS Product --</option>
          {productItems.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name} ({Number(it.quantity_on_hand || 0)} {it.unit_label} in store)
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2.5 items-center text-[11px] text-emerald-900">
        <div>
          <span className="block text-emerald-700">Auto Batch Unit Cost</span>
          <strong>₦{Math.round(previewUnitCost).toLocaleString('en-NG')} / unit</strong>
        </div>
        <Input
          label="Shelf Life (Days)"
          type="number"
          min="1"
          value={shelfLifeDays}
          onChange={(e) => onShelfLifeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
