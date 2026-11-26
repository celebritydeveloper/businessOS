import { Eye, PackagePlus, Pill } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { CatalogTableProps } from './Catalog.types';

export function CatalogTable({ items, supportsBatchExpiry, canRestock, onOpenStockModal, onInspectItem }: CatalogTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
        No products match your current filter. Click <strong>+ Add Product</strong> to add your first item.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
              <th className="py-3 px-4">Product / Item</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">SKU / Barcode</th>
              <th className="py-3 px-4">Selling Price</th>
              <th className="py-3 px-4">Branch Stock</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const qty = Number(item.quantity_on_hand || 0);
              const isLow = item.item_type === 'product' && qty <= Number(item.reorder_level || 5);
              const isBatchTracked = Boolean(Number(item.track_batches));

              return (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      {supportsBatchExpiry && isBatchTracked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-semibold">
                          <Pill className="w-2.5 h-2.5" /> Batch
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Unit: {item.unit_label} &bull; {Number(item.is_vat_exempt) ? 'VAT Exempt' : 'VAT Taxable'}
                    </p>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{item.category_name || 'Uncategorized'}</td>

                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.sku || '—'}
                    {item.barcode ? <span className="block text-[10px] text-slate-400">{item.barcode}</span> : null}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    ₦{Number(item.selling_price).toLocaleString('en-NG')}
                  </td>

                  <td className="py-3 px-4">
                    {item.item_type === 'service' ? (
                      <span className="text-slate-400">Service</span>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {qty} {item.unit_label}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {canRestock && item.item_type === 'product' && (
                      <Button type="button" variant="secondary" onClick={() => onOpenStockModal(item)}>
                        <PackagePlus className="w-3.5 h-3.5" /> Restock
                      </Button>
                    )}

                    <Button type="button" variant="secondary" onClick={() => onInspectItem(item)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
