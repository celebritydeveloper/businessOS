import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import type { SalePaymentSplit, SplitPaymentModalProps } from './Pos.types';

export function SplitPaymentModal({
  open,
  grandTotal,
  submitting,
  onClose,
  onConfirmSale,
}: SplitPaymentModalProps) {
  const [cash, setCash] = useState('');
  const [posCard, setPosCard] = useState('');
  const [transfer, setTransfer] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (open) {
      setCash(grandTotal.toFixed(2));
      setPosCard('');
      setTransfer('');
    }
  }, [open, grandTotal]);

  if (!open) return null;

  const cashAmt = parseFloat(cash) || 0;
  const cardAmt = parseFloat(posCard) || 0;
  const transferAmt = parseFloat(transfer) || 0;
  const totalPaid = cashAmt + cardAmt + transferAmt;
  const balanceDue = Math.max(0, grandTotal - totalPaid);
  const changeDue = Math.max(0, totalPaid - grandTotal);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (totalPaid + 0.01 < grandTotal) return;

    const splits: SalePaymentSplit[] = [];
    if (cashAmt > 0) splits.push({ method: 'cash', amount: cashAmt });
    if (cardAmt > 0) splits.push({ method: 'pos_card', amount: cardAmt });
    if (transferAmt > 0) splits.push({ method: 'transfer', amount: transferAmt });

    onConfirmSale(splits, customerName.trim(), customerPhone.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Complete Payment</h2>
            <p className="text-xs text-slate-500">
              Total Due: <strong className="text-brand-600">₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            <Input label="Cash (₦)" type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} />
            <Input label="POS Card (₦)" type="number" step="0.01" value={posCard} onChange={(e) => setPosCard(e.target.value)} />
            <Input label="Transfer (₦)" type="number" step="0.01" value={transfer} onChange={(e) => setTransfer(e.target.value)} />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
            {balanceDue > 0.01 ? (
              <span className="text-red-600 font-bold">Remaining Balance: ₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            ) : (
              <span className="text-emerald-700 font-bold">Change Due: ₦{changeDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            )}
            <span className="text-slate-500">Paid: ₦{totalPaid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Name (Opt.)" placeholder="Walk-in Customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input label="Customer Phone (Opt.)" placeholder="080..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={submitting} disabled={balanceDue > 0.01}>
              Confirm &amp; Print Receipt
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
