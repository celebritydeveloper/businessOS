import { useEffect, useState, type FormEvent } from 'react';
import { Eye, Pencil, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { CatalogItem, ProductCategory } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';

interface ProductDetailModalProps {
  item: CatalogItem | null;
  businessId: string;
  categories: ProductCategory[];
  canEdit: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function ProductDetailModal({
  item,
  businessId,
  categories,
  canEdit,
  onClose,
  onUpdated,
}: ProductDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unitLabel, setUnitLabel] = useState('Piece');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [isVatExempt, setIsVatExempt] = useState(false);

  useEffect(() => {
    if (!item) return;
    setEditing(false);
    setName(item.name);
    setCategoryId(item.category_id || '');
    setSku(item.sku || '');
    setBarcode(item.barcode || '');
    setUnitLabel(item.unit_label || 'Piece');
    setCostPrice(String(item.cost_price ?? 0));
    setSellingPrice(String(item.selling_price ?? 0));
    setReorderLevel(String(item.reorder_level ?? 5));
    setIsVatExempt(Boolean(Number(item.is_vat_exempt)));
  }, [item]);

  if (!item) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/catalog/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: name.trim(),
        category_id: categoryId || null,
        sku: sku.trim(),
        barcode: barcode.trim(),
        unit_label: unitLabel.trim() || 'Piece',
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        reorder_level: parseInt(reorderLevel, 10) || 5,
        is_vat_exempt: isVatExempt,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update product.', 'Update Failed');
      return;
    }

    toast.success('Product details updated.', 'Saved');
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {editing ? <Pencil className="w-4 h-4 text-brand-600" /> : <Eye className="w-4 h-4 text-brand-600" />}
            <h2 className="text-base font-bold text-slate-900">
              {editing ? 'Edit Product Details' : 'Product Details'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!editing ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-slate-400">Item Name</p>
                <p className="font-bold text-slate-900 mt-0.5">{item.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Type &amp; Unit</p>
                <p className="font-semibold text-slate-800 capitalize mt-0.5">{item.item_type} ({item.unit_label})</p>
              </div>
              <div>
                <p className="text-slate-400">SKU / Barcode</p>
                <p className="font-mono text-slate-800 mt-0.5">{item.sku || '—'} / {item.barcode || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400">Branch Stock on Hand</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {item.item_type === 'service' ? 'N/A (Service)' : `${Number(item.quantity_on_hand || 0)} ${item.unit_label}`}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Cost Price</p>
                <p className="font-semibold text-slate-800 mt-0.5">₦{Number(item.cost_price).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <p className="text-slate-400">Selling Price</p>
                <p className="font-bold text-brand-600 mt-0.5">₦{Number(item.selling_price).toLocaleString('en-NG')}</p>
              </div>
              <div>
                <p className="text-slate-400">Reorder Alert Level</p>
                <p className="font-semibold text-slate-800 mt-0.5">{item.reorder_level ?? 5} {item.unit_label}</p>
              </div>
              <div>
                <p className="text-slate-400">VAT Status</p>
                <p className="font-semibold text-slate-800 mt-0.5">{Number(item.is_vat_exempt) ? 'VAT Exempt' : 'Standard VAT'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
              {canEdit && (
                <Button type="button" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit Product
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5">
            <Input label="Item Name" value={name} onChange={(e) => setName(e.target.value)} required />

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
              <Input label="Unit Label" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
              <Input label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input label="Cost Price (₦)" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
              <Input label="Selling Price (₦)" type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
              <Input label="Reorder Level" type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isVatExempt} onChange={(e) => setIsVatExempt(e.target.checked)} />
              <span>VAT Exempt Item</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Save Changes</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
