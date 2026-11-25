import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import type { PaymentMethodCardProps } from './Billing.types';

export function PaymentMethodCard({ paymentMethod }: PaymentMethodCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Saved Payment Method</h2>
            <p className="text-[11px] text-slate-400">Used for recurring subscription billing</p>
          </div>
        </div>

        <Link to="/billing" className="text-xs font-semibold text-brand-600 hover:underline shrink-0">
          Update
        </Link>
      </div>

      {paymentMethod ? (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">
              {paymentMethod.brand} &bull;&bull;&bull;&bull; {paymentMethod.last4}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {paymentMethod.bank ? `${paymentMethod.bank} • ` : ''}
              {paymentMethod.exp_month && paymentMethod.exp_year
                ? `Expires ${paymentMethod.exp_month}/${paymentMethod.exp_year}`
                : 'Verified card authorization'}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold capitalize text-slate-700">
            {paymentMethod.gateway}
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
          No card details saved yet. Complete a payment checkout via Paystack or Flutterwave to attach a payment method.
        </div>
      )}
    </div>
  );
}
