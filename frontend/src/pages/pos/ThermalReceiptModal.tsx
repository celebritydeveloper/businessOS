import { Printer, X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { ThermalReceiptModalProps } from './Pos.types';

export function ThermalReceiptModal({ receipt, onClose }: ThermalReceiptModalProps) {
  if (!receipt) return null;

  const title = receipt.branding?.app_name || receipt.business_name;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 print:hidden">
          <span className="text-xs font-bold text-slate-700">
            {receipt.offline_queued ? 'Saved Offline (Queued for Sync)' : 'Sale Receipt'}
          </span>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 80mm Printable Receipt Body */}
        <div className="font-mono text-[11px] text-slate-800 space-y-2.5 p-2 border border-dashed border-slate-300 rounded-xl">
          <div className="text-center border-b border-dashed border-slate-300 pb-2">
            {receipt.branding?.logo_url && (
              <img src={receipt.branding.logo_url} alt={title} className="h-9 mx-auto mb-1 object-contain" />
            )}
            <p className="text-sm font-bold uppercase">{title}</p>
            <p>{receipt.branch_name}</p>
            {receipt.branding?.support_phone && <p>Tel: {receipt.branding.support_phone}</p>}
            <p className="mt-1 text-[10px]">Receipt: {receipt.receipt_number}</p>
            <p className="text-[10px]">{new Date(receipt.sold_at).toLocaleString('en-NG')}</p>
          </div>

          <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="truncate">
                  {item.quantity}&times; {item.name}
                </span>
                <span className="shrink-0">₦{item.line_total.toLocaleString('en-NG')}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₦{receipt.subtotal.toLocaleString('en-NG')}</span>
            </div>
            {receipt.discount_amount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₦{receipt.discount_amount.toLocaleString('en-NG')}</span>
              </div>
            )}
            {receipt.vat_amount > 0 && (
              <div className="flex justify-between">
                <span>VAT:</span>
                <span>₦{receipt.vat_amount.toLocaleString('en-NG')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
              <span>TOTAL:</span>
              <span>₦{receipt.grand_total.toLocaleString('en-NG')}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid ({receipt.payments.map((p) => p.method.toUpperCase()).join(' + ')}):</span>
              <span>₦{receipt.amount_paid.toLocaleString('en-NG')}</span>
            </div>
            {receipt.change_due > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Change:</span>
                <span>₦{receipt.change_due.toLocaleString('en-NG')}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
            <p>Thank you for your patronage!</p>
            {receipt.show_powered_by && <p className="mt-1 font-semibold">Powered by BusinessOS</p>}
          </div>
        </div>

        <div className="flex gap-2.5 print:hidden">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>New Sale</Button>
          <Button type="button" fullWidth onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}
