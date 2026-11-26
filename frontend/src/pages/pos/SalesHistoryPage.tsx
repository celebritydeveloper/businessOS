import { useCallback, useEffect, useState } from 'react';
import { Printer, Receipt } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { BrandingResponse, BusinessBranding } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import type { CompletedReceiptData, SaleHistoryItem, SalesListResponse } from './Pos.types';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export function SalesHistoryPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<CompletedReceiptData | null>(null);

  const loadSales = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const [salesRes, brandRes] = await Promise.all([
      apiFetch<SalesListResponse>(`/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/sales`),
      apiFetch<BrandingResponse>(`/workspace/businesses/${activeBusiness.id}/branding`),
    ]);
    if (salesRes.ok && salesRes.body.data) setSales(salesRes.body.data.sales);
    if (brandRes.ok && brandRes.body.data) {
      setBranding(brandRes.body.data.branding);
      setShowPoweredBy(brandRes.body.data.plan_controls.show_powered_by);
    }
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  if (!activeBusiness || !activeBranch) return null;

  const openReceipt = (sale: SaleHistoryItem) => {
    setSelectedReceipt({
      receipt_number: sale.receipt_number,
      sold_at: sale.sold_at,
      business_name: activeBusiness.name,
      branch_name: activeBranch.name,
      customer_name: sale.customer_name || undefined,
      items: sale.items.map((i) => ({
        name: i.item_name,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        vat_amount: Number(i.vat_amount),
        line_total: Number(i.line_total),
      })),
      subtotal: Number(sale.subtotal),
      discount_amount: Number(sale.discount_amount),
      vat_amount: Number(sale.vat_amount),
      grand_total: Number(sale.grand_total),
      amount_paid: Number(sale.amount_paid),
      change_due: Number(sale.change_due),
      payments: sale.payments,
      branding,
      show_powered_by: showPoweredBy,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sales &amp; Receipts</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Completed POS transactions in <strong>{activeBranch.name}</strong>
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading branch sales history...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          No POS sales recorded in this branch yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-brand-600" /> {sale.receipt_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{new Date(sale.sold_at).toLocaleString('en-NG')}</td>
                    <td className="py-3 px-4 text-slate-600">{sale.customer_name || 'Walk-in'}</td>
                    <td className="py-3 px-4 uppercase text-[11px] font-semibold text-slate-500">
                      {sale.payments.map((p) => p.method.replace('_', ' ')).join(' + ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₦{Number(sale.grand_total).toLocaleString('en-NG')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button type="button" variant="secondary" onClick={() => openReceipt(sale)}>
                        <Printer className="w-3.5 h-3.5" /> Reprint
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ThermalReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
