import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, Pill, Plus, Search, Wallet } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { CatalogItem, CatalogListResponse, ProductBatch, ProductCategory } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import { StatCard } from '../../shared/ui/StatCard';
import { toast } from '../../shared/ui/ToastProvider';
import { AddProductModal } from './AddProductModal';
import { CatalogTable } from './CatalogTable';
import { StockMovementModal } from './StockMovementModal';

export function CatalogPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stockModalItem, setStockModalItem] = useState<CatalogItem | null>(null);

  const isPharmacy = activeBusiness?.industry_type === 'pharmacy';

  const loadCatalog = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const res = await apiFetch<CatalogListResponse>(
      `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/catalog`
    );
    if (res.ok && res.body.data) {
      setItems(res.body.data.items);
      setCategories(res.body.data.categories);
      setBatches(res.body.data.batches);
    } else {
      toast.error(res.body.message || 'Could not load catalog.', 'Error');
    }
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory && item.category_id !== selectedCategory) return false;
      if (lowStockOnly && (item.item_type !== 'product' || Number(item.quantity_on_hand) > Number(item.reorder_level))) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q))
      );
    });
  }, [items, search, selectedCategory, lowStockOnly]);

  const stats = useMemo(() => {
    let lowCount = 0;
    let stockValue = 0;
    for (const item of items) {
      if (item.item_type === 'product') {
        const qty = Number(item.quantity_on_hand || 0);
        if (qty <= Number(item.reorder_level || 5)) lowCount++;
        stockValue += qty * Number(item.cost_price || 0);
      }
    }
    const expiringSoon = batches.filter((b) => Number(b.days_to_expiry ?? 999) <= 30).length;
    return { lowCount, stockValue, expiringSoon };
  }, [items, batches]);

  if (!activeBusiness || !activeBranch) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Catalog &amp; Branch Stock</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Managing stock for <strong>{activeBranch.name}</strong> ({activeBusiness.name})
          </p>
        </div>

        <Button type="button" onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Catalog SKUs" value={items.length} subtitle="Shared across all branches" icon={Package} />
        <StatCard
          label="Low Stock Alerts"
          value={stats.lowCount}
          subtitle={`At or below reorder threshold`}
          icon={AlertTriangle}
          iconColorClass="text-amber-500"
        />
        <StatCard
          label="Branch Stock Cost Value"
          value={`₦${stats.stockValue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`}
          subtitle={`Valuation in ${activeBranch.name}`}
          icon={Wallet}
          iconColorClass="text-emerald-600"
        />
        <StatCard
          label={isPharmacy ? 'Expiring Batches (≤30d)' : 'Active Categories'}
          value={isPharmacy ? stats.expiringSoon : categories.length}
          subtitle={isPharmacy ? 'FEFO expiry watch active' : 'Industry default categories'}
          icon={Pill}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-600"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 px-3 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low Stock Only
        </label>
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading catalog &amp; branch inventory...</div>
      ) : (
        <CatalogTable items={filteredItems} isPharmacy={isPharmacy} onOpenStockModal={setStockModalItem} />
      )}

      <AddProductModal
        open={addModalOpen}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        isPharmacy={isPharmacy}
        categories={categories}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => void loadCatalog()}
      />

      <StockMovementModal
        item={stockModalItem}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        onClose={() => setStockModalItem(null)}
        onRecorded={() => void loadCatalog()}
      />
    </div>
  );
}
