import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { CreateCatalogItemPayload, ItemType } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { AddProductModalProps } from './Catalog.types';

export function AddProductModal({
  open,
  businessId,
  branchId,
  isPharmacy,
  categories,
  onClose,
  onCreated,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [itemType, setItemType] = useState<ItemType>('product');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unitLabel, setUnitLabel] = useState(isPharmacy ? 'Pack' : 'Piece');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [isVatExempt, setIsVatExempt] = useState(isPharmacy);
  const [trackBatches, setTrackBatches] = useState(isPharmacy);
  const [openingStock, setOpeningStock] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: CreateCatalogItemPayload = {
      name: name.trim(),
      category_id: categoryId || null,
      item_type: itemType,
      sku: sku.trim(),
      barcode: barcode.trim(),
      unit_label: unitLabel.trim() || 'Piece',
      cost_price: parseFloat(costPrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      is_vat_exempt: isVatExempt,
      track_batches: itemType === 'product' && trackBatches,
      reorder_level: parseInt(reorderLevel, 10) || 5,
      branch_id: branchId,
      opening_stock: parseFloat(openingStock) || 0,
      batch_number: batchNumber.trim(),
      expiry_date: expiryDate,
    };

    const res = await apiFetch(`/workspace/businesses/${businessId}/catalog`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not create item.', 'Error');
      return;
    }

    toast.success(`${name} added to catalog.`, 'Item Saved');
    setName('');
    setSku('');
    setBarcode('');
    setOpeningStock('');
    setBatchNumber('');
    setExpiryDate('');
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Add New Catalog Item</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input label="Item Name" placeholder="e.g., Amoxicillin 500mg Capsules" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Item Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="product">Physical Product</option>
                <option value="service">Service / Consultation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="SKU" placeholder="AMX-500" value={sku} onChange={(e) => setSku(e.target.value)} />
            <Input label="Barcode" placeholder="6151100..." value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            <Input label="Unit" placeholder="Pack / Piece" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Cost Price (₦)" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
            <Input label="Selling Price (₦)" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
            <Input label="Reorder Alert" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isVatExempt} onChange={(e) => setIsVatExempt(e.target.checked)} />
              VAT-Exempt Item
            </label>
            {itemType === 'product' && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={trackBatches} onChange={(e) => setTrackBatches(e.target.checked)} />
                Track Batch &amp; Expiry (FEFO)
              </label>
            )}
          </div>

          {itemType === 'product' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-800">Optional Opening Stock for Active Branch</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Opening Qty" type="number" step="0.01" value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
                {trackBatches && (
                  <>
                    <Input label="Batch Number" placeholder="BN-2026A" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required={Number(openingStock) > 0} />
                    <Input label="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required={Number(openingStock) > 0} />
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
