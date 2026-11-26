import { useState, type FormEvent } from 'react';
import { Sprout, X } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';
import type { FarmCycleType } from './Agriculture.types';

interface CreateCycleModalProps {
  open: boolean;
  businessId: string;
  branchId: string;
  onClose: () => void;
  onCreated: () => void;
}

const LIVESTOCK_UNITS = [
  'Birds',
  'Fingerlings / Fish',
  'Pigs',
  'Goats / Sheep',
  'Cattle',
  'Rabbits',
  'Snails',
];

const CROP_LAND_UNITS = [
  'Plots',
  'Acres',
  'Hectares',
];

export function CreateCycleModal({ open, businessId, branchId, onClose, onCreated }: CreateCycleModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [cycleType, setCycleType] = useState<FarmCycleType>('livestock');
  const [name, setName] = useState('');
  const [speciesOrCrop, setSpeciesOrCrop] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unitLabel, setUnitLabel] = useState('Birds');
  const [initialCost, setInitialCost] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const unitOptions = cycleType === 'crop' ? CROP_LAND_UNITS : LIVESTOCK_UNITS;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/workspace/businesses/${businessId}/branches/${branchId}/farm-cycles`, {
      method: 'POST',
      body: JSON.stringify({
        cycle_type: cycleType,
        name: name.trim(),
        species_or_crop: speciesOrCrop.trim(),
        initial_quantity: parseFloat(initialQuantity) || 0,
        unit_label: unitLabel,
        initial_cost: parseFloat(initialCost) || 0,
        start_date: startDate,
        expected_harvest_date: expectedHarvestDate,
        notes: notes.trim(),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Could not start farm cycle.', 'Error');
      return;
    }

    toast.success(`Production cycle "${name}" started!`, 'Cycle Created');
    setName('');
    setSpeciesOrCrop('');
    setInitialQuantity('');
    setInitialCost('');
    setNotes('');
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Start Livestock / Crop Cycle</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Cycle Category</label>
              <select
                value={cycleType}
                onChange={(e) => {
                  const val = e.target.value as FarmCycleType;
                  setCycleType(val);
                  setUnitLabel(val === 'crop' ? 'Plots' : 'Birds');
                }}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="livestock">Livestock / Poultry / Fish</option>
                <option value="crop">Crop Planting Season</option>
              </select>
            </div>
            <Input
              label={cycleType === 'livestock' ? 'Species / Breed' : 'Crop Variety'}
              placeholder={cycleType === 'livestock' ? 'e.g., Ross 308 Broilers / Catfish' : 'e.g., Yellow Maize / Cassava'}
              value={speciesOrCrop}
              onChange={(e) => setSpeciesOrCrop(e.target.value)}
              required
            />
          </div>

          <Input
            label="Cycle / Batch Name"
            placeholder={cycleType === 'livestock' ? 'e.g., Broiler Batch #4 — Pen A' : 'e.g., Dry Season Maize — Plot 2'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={cycleType === 'crop' ? 'Land Size' : 'Initial Stock Qty'}
              type="number"
              step="0.01"
              placeholder={cycleType === 'crop' ? '4' : '500'}
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {cycleType === 'crop' ? 'Land Unit' : 'Livestock Unit'}
              </label>
              <select
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <Input
              label="Opening Cost (₦)"
              type="number"
              step="0.01"
              placeholder="325000"
              value={initialCost}
              onChange={(e) => setInitialCost(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="Expected Harvest Date" type="date" value={expectedHarvestDate} onChange={(e) => setExpectedHarvestDate(e.target.value)} required />
          </div>

          <Input label="Notes (Optional)" placeholder="Pen/pond location, hatchery, or soil prep details" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Start Cycle</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
