import { useCallback, useEffect, useState } from 'react';
import { Plus, Sprout, Warehouse } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { CatalogItem, CatalogListResponse } from '../../core/types';
import { Button } from '../../shared/ui/Button';
import type { FarmCycleItem, FarmInputItem } from './Agriculture.types';
import { CreateCycleModal } from './CreateCycleModal';
import { CycleLogModal } from './CycleLogModal';
import { CycleTimelineModal } from './CycleTimelineModal';
import { FarmCycleCard } from './FarmCycleCard';
import { FarmInputStoreTab } from './FarmInputStoreTab';

export function FarmCyclesPage() {
  const { activeBusiness, activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'cycles' | 'inputs'>('cycles');
  const [cycles, setCycles] = useState<FarmCycleItem[]>([]);
  const [farmInputs, setFarmInputs] = useState<FarmInputItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'harvested'>('all');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [timelineCycle, setTimelineCycle] = useState<FarmCycleItem | null>(null);
  const [logCycle, setLogCycle] = useState<FarmCycleItem | null>(null);

  const loadData = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id) return;
    setLoading(true);
    const [cycRes, inpRes, catRes] = await Promise.all([
      apiFetch<{ cycles: FarmCycleItem[] }>(
        `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/farm-cycles`
      ),
      apiFetch<{ inputs: FarmInputItem[] }>(
        `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/farm-inputs`
      ),
      apiFetch<CatalogListResponse>(
        `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/catalog`
      ),
    ]);

    if (cycRes.ok && cycRes.body.data) setCycles(cycRes.body.data.cycles);
    if (inpRes.ok && inpRes.body.data) setFarmInputs(inpRes.body.data.inputs);
    if (catRes.ok && catRes.body.data) setCatalogItems(catRes.body.data.items);
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!activeBusiness || !activeBranch) return null;

  const visibleCycles = cycles.filter((c) => (filter === 'all' ? true : c.status === filter));
  const lowInputsCount = farmInputs.filter(
    (i) => Number(i.quantity_on_hand || 0) <= Number(i.reorder_level || 0)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agriculture &amp; Production Cycles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage livestock batches, crop seasons, and internal farm input supplies at <strong>{activeBranch.name}</strong>.
          </p>
        </div>

        {activeTab === 'cycles' && (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Start New Cycle
          </Button>
        )}
      </div>

      {/* Main Module Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cycles')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'cycles'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" /> Production Cycles ({cycles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inputs')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'inputs'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" /> Farm Input Store ({farmInputs.length})
            {lowInputsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                {lowInputsCount} Low
              </span>
            )}
          </button>
        </div>

        {activeTab === 'cycles' && (
          <div className="flex gap-1.5">
            {(['all', 'active', 'harvested'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                  filter === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading agriculture workspace...</div>
      ) : activeTab === 'inputs' ? (
        <FarmInputStoreTab
          businessId={activeBusiness.id}
          branchId={activeBranch.id}
          inputs={farmInputs}
          onRefresh={() => void loadData()}
        />
      ) : visibleCycles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <Sprout className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No production cycles found</p>
          <p className="text-xs text-slate-500">
            Start your first poultry batch, fish pond run, or crop planting cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleCycles.map((cycle) => (
            <FarmCycleCard
              key={cycle.id}
              cycle={cycle}
              onOpenTimeline={setTimelineCycle}
              onQuickLog={setLogCycle}
            />
          ))}
        </div>
      )}

      <CreateCycleModal
        open={createOpen}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void loadData()}
      />

      <CycleTimelineModal cycle={timelineCycle} onClose={() => setTimelineCycle(null)} />

      <CycleLogModal
        cycle={logCycle}
        businessId={activeBusiness.id}
        branchId={activeBranch.id}
        catalogItems={catalogItems}
        farmInputs={farmInputs}
        onClose={() => setLogCycle(null)}
        onSaved={() => void loadData()}
      />
    </div>
  );
}
