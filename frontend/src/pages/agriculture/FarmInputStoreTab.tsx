import { useState, type FormEvent } from 'react';
import { AlertTriangle, PackagePlus, Warehouse } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { FarmInputCategory, FarmInputItem } from './Agriculture.types';

interface FarmInputStoreTabProps {
  businessId: string;
  branchId: string;
  inputs: FarmInputItem[];
  onRefresh: () => void;
}

export function FarmInputStoreTab({ businessId, branchId, inputs, onRefresh }: FarmInputStoreTabProps) {
  const [mode, setMode] = useState<'new' | 'restock'>('new');
  const [selectedInputId, setSelectedInputId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FarmInputCategory>('feed');
  const [unitLabel, setUnitLabel] = useState('Bags');
  const [quantity, setQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [unitCost, setUnitCost] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/branches/${branchId}/farm-inputs`, {
      method: 'POST',
      body: JSON.stringify({
        input_id: mode === 'restock' ? selectedInputId : '',
        name: name.trim(),
        category,
        unit_label: unitLabel,
        quantity: parseFloat(quantity) || 0,
        reorder_level: parseFloat(reorderLevel) || 5,
        unit_cost: parseFloat(unitCost) || 0,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not update Farm Input Store.', 'Error');
      return;
    }

    toast.success('Farm Input Store updated.', 'Saved');
    setName('');
    setQuantity('');
    setUnitCost('');
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Input Stock Table */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-emerald-600" /> Internal Farm Input Store (Not on POS)
          </span>
          <span className="text-slate-400">{inputs.length} supplies tracked</span>
        </div>

        {inputs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No farm inputs stocked yet. Add bulk feed, fertilizer, seeds, or vaccines on the right.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Input Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">In Store</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inputs.map((inp) => {
                  const qty = Number(inp.quantity_on_hand || 0);
                  const low = qty <= Number(inp.reorder_level || 0);
                  return (
                    <tr key={inp.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>{inp.name}</span>
                        {low && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-500">{inp.category.replace('_', ' / ')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {qty.toLocaleString()} {inp.unit_label}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₦{Number(inp.unit_cost || 0).toLocaleString('en-NG')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right: Stock / Restock Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <PackagePlus className="w-4 h-4 text-brand-600" /> Stock Farm Input
          </h3>
          {inputs.length > 0 && (
            <div className="flex gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer ${mode === 'new' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('restock');
                  setSelectedInputId(inputs.at(0)?.id || '');
                }}
                className={`px-2 py-1 rounded font-semibold cursor-pointer ${mode === 'restock' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Restock
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {mode === 'restock' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Select Existing Input</label>
              <select
                value={selectedInputId}
                onChange={(e) => setSelectedInputId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                required
              >
                {inputs.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({Number(i.quantity_on_hand)} {i.unit_label})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <Input label="Input Name" placeholder="e.g., Ultima Layer Mash" value={name} onChange={(e) => setName(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FarmInputCategory)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                  >
                    <option value="feed">Animal / Fish Feed</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="seed">Seeds / Seedlings</option>
                    <option value="vaccine_drug">Vaccines / Vet Drugs</option>
                    <option value="other">Other Farm Supply</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Unit</label>
                  <select
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Litres">Litres</option>
                    <option value="Vials">Vials</option>
                    <option value="Sachets">Sachets</option>
                    <option value="Kg">Kg</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Qty Added" type="number" step="0.01" placeholder="50" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <Input label="Cost per Unit (₦)" type="number" step="0.01" placeholder="18500" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
          </div>

          {mode === 'new' && (
            <Input label="Low-Stock Alert Threshold" type="number" step="0.01" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          )}

          <Button type="submit" className="w-full" isLoading={saving}>
            {mode === 'restock' ? 'Add to Farm Input Store' : 'Save Farm Input'}
          </Button>
        </form>
      </div>
    </div>
  );
}
