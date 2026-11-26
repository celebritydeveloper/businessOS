import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { PosCartPanelProps } from './Pos.types';

export function PosCartPanel({
  cart,
  discount,
  isVatRegistered,
  defaultVatRate,
  onUpdateQty,
  onRemoveItem,
  onDiscountChange,
  onClearCart,
  onOpenCheckout,
}: PosCartPanelProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const vatAmount = isVatRegistered
    ? cart.reduce(
        (sum, item) =>
          item.is_vat_exempt ? sum : sum + item.unit_price * item.quantity * (defaultVatRate / 100),
        0
      )
    : 0;
  const grandTotal = Math.max(0, subtotal - discount + vatAmount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full shadow-xs">
      {/* Cart Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-brand-600" /> Current Order ({cart.length})
        </span>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Line Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-4">
        {cart.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-center text-xs text-slate-400">
            Tap products or scan a barcode to start a sale.
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.catalog_item_id} className="py-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                <p className="text-[11px] text-slate-500">
                  ₦{item.unit_price.toLocaleString('en-NG')} &times; {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.catalog_item_id, -1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.catalog_item_id, 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.catalog_item_id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Checkout Trigger */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold">₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Discount (₦)</span>
          <input
            type="number"
            min="0"
            value={discount || ''}
            placeholder="0"
            onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-24 h-8 px-2 text-right rounded-lg border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div className="flex justify-between text-slate-600">
          <span>VAT ({isVatRegistered ? `${defaultVatRate}%` : 'Exempt'})</span>
          <span className="font-semibold">₦{vatAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">Grand Total</span>
          <span className="text-xl font-extrabold text-brand-600">
            ₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <Button type="button" fullWidth disabled={cart.length === 0} onClick={onOpenCheckout}>
          Charge ₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </Button>
      </div>
    </div>
  );
}
