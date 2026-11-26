import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { syncEngine } from '../../core/sync/syncEngine';
import type { BrandingResponse, BusinessBranding, CatalogItem, CatalogListResponse, ProductCategory } from '../../core/types';
import { toast } from '../../shared/ui/ToastProvider';
import type { CompletedReceiptData, PosCartItem, SalePaymentSplit } from './Pos.types';
import { PosCartPanel } from './PosCartPanel';
import { PosProductGrid } from './PosProductGrid';
import { SplitPaymentModal } from './SplitPaymentModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { POS_LOCK_STORAGE_KEY, SwitchCashierModal } from './SwitchCashierModal';
import { Button } from '../../shared/ui/Button';
import { KeyRound } from 'lucide-react';

export function PosTerminalPage() {
  const { me, activeBusiness, activeBranch } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CompletedReceiptData | null>(null);
  const [switchCashierOpen, setSwitchCashierOpen] = useState(() => localStorage.getItem(POS_LOCK_STORAGE_KEY) === '1');


  const loadPosData = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    const [catRes, brandRes] = await Promise.all([
      apiFetch<CatalogListResponse>(`/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/catalog`),
      apiFetch<BrandingResponse>(`/workspace/businesses/${activeBusiness.id}/branding`),
    ]);

    if (catRes.ok && catRes.body.data) {
      setItems(catRes.body.data.items);
      setCategories(catRes.body.data.categories);
    }
    if (brandRes.ok && brandRes.body.data) {
      setBranding(brandRes.body.data.branding);
      setShowPoweredBy(brandRes.body.data.plan_controls.show_powered_by);
    }
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadPosData();
  }, [loadPosData]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q))
      );
    });
  }, [items, search, selectedCategory]);

  const handleAddToCart = (item: CatalogItem) => {
    const isService = item.item_type === 'service';
    const maxStock = isService ? null : Number(item.quantity_on_hand || 0);
    if (!isService && (maxStock ?? 0) <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.catalog_item_id === item.id);
      if (existing) {
        if (maxStock !== null && existing.quantity + 1 > maxStock) {
          toast.error(`Only ${maxStock} ${item.unit_label} in stock.`, 'Stock Limit');
          return prev;
        }
        return prev.map((c) => (c.catalog_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          catalog_item_id: item.id,
          name: item.name,
          unit_label: item.unit_label,
          unit_price: Number(item.selling_price),
          quantity: 1,
          is_vat_exempt: Boolean(Number(item.is_vat_exempt)),
          max_stock: maxStock,
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.catalog_item_id !== itemId) return c;
          const next = c.quantity + delta;
          if (next <= 0) return null;
          if (c.max_stock !== null && next > c.max_stock) return c;
          return { ...c, quantity: next };
        })
        .filter((c): c is PosCartItem => c !== null)
    );
  };

  if (!activeBusiness || !activeBranch) return null;
  const isVatReg = Boolean(activeBusiness.is_vat_registered);
  const vatRate = isVatReg ? Number(activeBusiness.default_vat_rate || 7.5) : 0;
  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const vatAmount = isVatReg ? cart.reduce((s, c) => (c.is_vat_exempt ? s : s + c.unit_price * c.quantity * (vatRate / 100)), 0) : 0;
  const grandTotal = Math.max(0, subtotal - discount + vatAmount);

  const handleConfirmSale = async (payments: SalePaymentSplit[], customerName: string, customerPhone: string) => {
    setSubmitting(true);
    const clientSaleUuid = crypto.randomUUID();
    const receiptNo = `BOS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const soldAt = new Date().toISOString();
    const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
    const changeDue = Math.max(0, amountPaid - grandTotal);
    const salePayload = {
      client_sale_uuid: clientSaleUuid,
      receipt_number: receiptNo,
      customer_name: customerName,
      customer_phone: customerPhone,
      discount_amount: discount,
      sold_at: soldAt,
      items: cart.map((c) => ({ catalog_item_id: c.catalog_item_id, quantity: c.quantity, unit_price: c.unit_price })),
      payments,
    };

    let offlineQueued = false;
    if (!navigator.onLine) {
      await syncEngine.enqueue(activeBusiness.id, activeBranch.id, 'sale.created', salePayload);
      offlineQueued = true;
    } else {
      const res = await apiFetch(`/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/sales`, {
        method: 'POST',
        body: JSON.stringify(salePayload),
      });
      if (!res.ok) {
        setSubmitting(false);
        toast.error(res.body.message || 'Could not record POS sale.', 'Checkout Error');
        return;
      }
    }

    setSubmitting(false);
    setCheckoutOpen(false);
    setReceipt({
      receipt_number: receiptNo,
      sold_at: soldAt,
      business_name: activeBusiness.name,
      branch_name: activeBranch.name,
      customer_name: customerName || undefined,
      items: cart.map((c) => {
        const lineNet = c.unit_price * c.quantity;
        const lineVat = isVatReg && !c.is_vat_exempt ? lineNet * (vatRate / 100) : 0;
        return { name: c.name, quantity: c.quantity, unit_price: c.unit_price, vat_amount: lineVat, line_total: lineNet + lineVat };
      }),
      subtotal,
      discount_amount: discount,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      change_due: changeDue,
      payments,
      branding,
      show_powered_by: showPoweredBy,
      offline_queued: offlineQueued,
    });

    setCart([]);
    setDiscount(0);
    void loadPosData();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          Active Cashier: <strong className="text-slate-900">{me?.user.full_name}</strong> &bull; {activeBranch.name}
        </div>
        <Button type="button" variant="secondary" onClick={() => setSwitchCashierOpen(true)}>
          <KeyRound className="w-4 h-4" /> Switch Cashier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-11rem)]">
        <div className="lg:col-span-7 xl:col-span-8">
          <PosProductGrid
            items={filteredItems}
            categories={categories}
            search={search}
            selectedCategory={selectedCategory}
            onSearchChange={setSearch}
            onCategoryChange={setSelectedCategory}
            onAddToCart={handleAddToCart}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <PosCartPanel
            cart={cart}
            discount={discount}
            isVatRegistered={isVatReg}
            defaultVatRate={vatRate}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={(id) => setCart((p) => p.filter((c) => c.catalog_item_id !== id))}
            onDiscountChange={setDiscount}
            onClearCart={() => { setCart([]); setDiscount(0); }}
            onOpenCheckout={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      <SplitPaymentModal
        open={checkoutOpen}
        grandTotal={grandTotal}
        submitting={submitting}
        onClose={() => setCheckoutOpen(false)}
        onConfirmSale={(splits, cname, cphone) => void handleConfirmSale(splits, cname, cphone)}
      />

      <ThermalReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      <SwitchCashierModal
        open={switchCashierOpen}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        businessName={activeBusiness.name}
        branchName={activeBranch.name}
        onUnlocked={() => setSwitchCashierOpen(false)}
      />

    </div>
  );
}
