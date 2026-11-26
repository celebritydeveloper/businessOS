import { Barcode, Plus, Search } from 'lucide-react';
import type { PosProductGridProps } from './Pos.types';

export function PosProductGrid({
  items,
  categories,
  search,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onAddToCart,
}: PosProductGridProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = search.trim().toLowerCase();
    if (!q) return;

    const exactBarcode = items.find((i) => i.barcode && i.barcode.toLowerCase() === q);
    if (exactBarcode) {
      e.preventDefault();
      onAddToCart(exactBarcode);
      onSearchChange('');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Barcode / Search Input + Category Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Scan barcode or search product name / SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-600"
          />
          <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Product Cards Grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          No matching items found. Add products in <strong>Catalog &amp; Stock</strong> first.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-0.5">
          {items.map((item) => {
            const isService = item.item_type === 'service';
            const stock = Number(item.quantity_on_hand || 0);
            const outOfStock = !isService && stock <= 0;

            return (
              <button
                key={item.id}
                type="button"
                disabled={outOfStock}
                onClick={() => onAddToCart(item)}
                className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  outOfStock
                    ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-brand-600 hover:shadow-xs cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{item.name}</p>
                    {!outOfStock && <Plus className="w-4 h-4 text-brand-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isService ? 'Service' : `${stock} ${item.unit_label} left`}
                  </p>
                </div>

                <p className="text-sm font-extrabold text-brand-600 mt-3">
                  ₦{Number(item.selling_price).toLocaleString('en-NG')}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
