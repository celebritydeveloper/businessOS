import { Eye, Pencil, X } from 'lucide-react';
import type { CatalogItem } from '../../core/types';
import { Button } from '../../shared/ui/Button';

interface ProductViewModalProps {
  item: CatalogItem | null;
  canEdit: boolean;
  onClose: () => void;
  onStartEdit: (item: CatalogItem) => void;
}

export function ProductViewModal({ item, canEdit, onClose, onStartEdit }: ProductViewModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Product Details</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
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

        <div className="flex justify-end gap-2.5 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          {canEdit && (
            <Button type="button" onClick={() => onStartEdit(item)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Product
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
