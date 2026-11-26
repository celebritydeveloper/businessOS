import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import type { CustomerItem } from '../contacts/Contacts.types';
import type { SalePaymentSplit, SplitPaymentModalProps } from './Pos.types';
import { PosCustomerSelector } from './PosCustomerSelector';

export function SplitPaymentModal({
  open,
  businessId,
  grandTotal,
  submitting,
  onClose,
  onConfirmSale,
}: SplitPaymentModalProps) {
  const [cash, setCash] = useState('');
  const [posCard, setPosCard] = useState('');
  const [transfer, setTransfer] = useState('');
  const [credit, setCredit] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (open) {
      setCash(grandTotal.toFixed(2));
      setPosCard('');
      setTransfer('');
      setCredit('');
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [open, grandTotal]);

  if (!open) return null;

  const cashAmt = parseFloat(cash) || 0;
  const cardAmt = parseFloat(posCard) || 0;
  const transferAmt = parseFloat(transfer) || 0;
  const creditAmt = selectedCustomer ? parseFloat(credit) || 0 : 0;
  const totalCovered = cashAmt + cardAmt + transferAmt + creditAmt;
  const balanceDue = Math.max(0, grandTotal - totalCovered);
  const changeDue = Math.max(0, totalCovered - grandTotal);

  const handlePutFullOnCredit = () => {
    if (!selectedCustomer) return;
    setCash('');
    setPosCard('');
    setTransfer('');
    setCredit(grandTotal.toFixed(2));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (totalCovered + 0.01 < grandTotal) return;

    const splits: SalePaymentSplit[] = [];
    if (cashAmt > 0) splits.push({ method: 'cash', amount: cashAmt });
    if (cardAmt > 0) splits.push({ method: 'pos_card', amount: cardAmt });
    if (transferAmt > 0) splits.push({ method: 'transfer', amount: transferAmt });
    if (creditAmt > 0) splits.push({ method: 'credit', amount: creditAmt });

    onConfirmSale(splits, customerName.trim(), customerPhone.trim(), selectedCustomer?.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
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
          <PosCustomerSelector
            businessId={businessId}
            selectedCustomer={selectedCustomer}
            customerName={customerName}
            customerPhone={customerPhone}
            onSelectCustomer={(cust) => {
              setSelectedCustomer(cust);
              if (!cust) setCredit('');
            }}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Input label="Cash (₦)" type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} />
            <Input label="POS Card (₦)" type="number" step="0.01" value={posCard} onChange={(e) => setPosCard(e.target.value)} />
            <Input label="Transfer (₦)" type="number" step="0.01" value={transfer} onChange={(e) => setTransfer(e.target.value)} />
            <Input
              label="Credit (₦)"
              type="number"
              step="0.01"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              disabled={!selectedCustomer}
              placeholder={selectedCustomer ? '0.00' : 'Select cust.'}
            />
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between text-[11px] bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 text-amber-900">
              <span>
                Limit: {Number(selectedCustomer.credit_limit) > 0 ? `₦${Number(selectedCustomer.credit_limit).toLocaleString('en-NG')}` : 'Unlimited'}
              </span>
              <button type="button" onClick={handlePutFullOnCredit} className="font-bold text-amber-800 underline cursor-pointer">
                Put 100% on Credit
              </button>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
            {balanceDue > 0.01 ? (
              <span className="text-red-600 font-bold">Remaining Balance: ₦{balanceDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            ) : (
              <span className="text-emerald-700 font-bold">Change Due: ₦{changeDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            )}
            <span className="text-slate-500">Covered: ₦{totalCovered.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
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
