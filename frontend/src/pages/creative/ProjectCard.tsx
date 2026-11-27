import { useState } from 'react';
import { Banknote, CheckSquare, Clock, ExternalLink, FileText, Link2, Plus, RefreshCw, RotateCcw, Square, Wallet } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { toast } from '../../shared/ui/ToastProvider';
import type { CreativeProjectItem, ProjectStage } from './Creative.types';
import type { ProjectModalMode } from './ProjectActionModal';

interface ProjectCardProps {
  project: CreativeProjectItem;
  onStageChange: (projectId: string, stage: ProjectStage) => void;
  onToggleDeliverable: (projectId: string, logId: string) => void;
  onSaveDeliveryUrl: (projectId: string, url: string) => void;
  onOpenModal: (project: CreativeProjectItem, mode: ProjectModalMode) => void;
  onOpenInvoice: (project: CreativeProjectItem) => void;
}

export function ProjectCard({
  project,
  onStageChange,
  onToggleDeliverable,
  onSaveDeliveryUrl,
  onOpenModal,
  onOpenInvoice,
}: ProjectCardProps) {
  const [deliveryUrl, setDeliveryUrl] = useState(project.delivery_url || '');
  const [editingDelivery, setEditingDelivery] = useState(false);

  const quote = Number(project.contract_amount || 0);
  const paid = Number(project.amount_paid || 0);
  const cost = Number(project.direct_cost || 0);
  const hours = Number(project.total_hours_logged || 0);
  const netProfit = quote - cost;
  const effectiveRate = hours > 0 ? Math.round(quote / hours) : 0;
  const deliverables = project.logs.filter((l) => l.log_type === 'deliverable');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{project.title}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
              {project.project_type === 'monthly_retainer' ? `Retainer • ${project.billing_cycle_label || 'Monthly'}` : 'Fixed Project'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: <strong>{project.customer_name || 'Walk-in / Unlinked'}</strong>
            {project.due_date ? ` • Due ${project.due_date}` : ''}
          </p>
        </div>

        <select
          value={project.stage}
          onChange={(e) => onStageChange(project.id, e.target.value as ProjectStage)}
          className="h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
        >
          <option value="brief">Stage: Brief</option>
          <option value="in_progress">Stage: In Progress</option>
          <option value="client_review">Stage: Client Review</option>
          <option value="revisions">Stage: Revisions</option>
          <option value="delivered">Stage: Delivered</option>
        </select>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
        <div>
          <p className="text-[11px] text-slate-500">Quote / Paid</p>
          <p className="font-bold text-slate-900">₦{quote.toLocaleString('en-NG')} / <span className="text-emerald-700">₦{paid.toLocaleString('en-NG')}</span></p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Net Margin (After Costs)</p>
          <p className="font-bold text-slate-900">₦{netProfit.toLocaleString('en-NG')}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Time Logged</p>
          <p className="font-bold text-slate-900">
            {hours} hrs {effectiveRate > 0 ? <span className="text-[11px] font-normal text-slate-500">(₦{effectiveRate.toLocaleString('en-NG')}/hr)</span> : ''}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Revisions Used</p>
          <p className={`font-bold ${project.revisions_used > project.revisions_included ? 'text-rose-600' : 'text-slate-900'}`}>
            {project.revisions_used} / {project.revisions_included}
          </p>
        </div>
      </div>

      {/* Final File Delivery Link Box */}
      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {editingDelivery ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <input
              type="url"
              placeholder="https://google.com... or WeTransfer link"
              value={deliveryUrl}
              onChange={(e) => setDeliveryUrl(e.target.value)}
              className="flex-1 min-w-[200px] h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
            />
            <Button
              type="button"
              onClick={() => {
                onSaveDeliveryUrl(project.id, deliveryUrl.trim());
                setEditingDelivery(false);
              }}
            >
              Save Link
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditingDelivery(false)}>Cancel</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-slate-700">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              {project.delivery_url ? (
                <a href={project.delivery_url} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline truncate max-w-xs sm:max-w-md">
                  {project.delivery_url}
                </a>
              ) : (
                <span className="text-slate-500">No final deliverable link uploaded yet</span>
              )}
            </div>
            <button type="button" onClick={() => setEditingDelivery(true)} className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer">
              {project.delivery_url ? 'Change Link' : '+ Add Final Files Link'}
            </button>
          </>
        )}
      </div>

      {/* Deliverables Checklist */}
      {deliverables.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deliverables</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {deliverables.map((d) => {
              const done = Boolean(Number(d.is_completed));
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onToggleDeliverable(project.id, d.id)}
                  className="flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {done ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className={done ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>{d.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={() => onOpenModal(project, 'deliverable')}>
          <Plus className="w-3.5 h-3.5" /> Deliverable
        </Button>
        <Button type="button" variant="secondary" onClick={() => onOpenModal(project, 'time_log')}>
          <Clock className="w-3.5 h-3.5" /> Log Time
        </Button>
        <Button type="button" variant="secondary" onClick={() => onOpenModal(project, 'revision')}>
          <RotateCcw className="w-3.5 h-3.5" /> +1 Revision
        </Button>
        <Button type="button" variant="secondary" onClick={() => onOpenModal(project, 'expense')}>
          <Wallet className="w-3.5 h-3.5" /> Job Cost
        </Button>
        <Button type="button" onClick={() => onOpenModal(project, 'payment')}>
          <Banknote className="w-3.5 h-3.5" /> Bill / Payment
        </Button>
        {project.project_type === 'monthly_retainer' && (
          <Button type="button" onClick={() => onOpenModal(project, 'renew_retainer')}>
            <RefreshCw className="w-3.5 h-3.5" /> Renew Retainer
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => onOpenInvoice(project)}>
          <FileText className="w-3.5 h-3.5" /> Invoice / Receipt
        </Button>
        {project.public_token && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const url = `${window.location.origin}/track/${project.public_token}`;
              void navigator.clipboard.writeText(url);
              toast.success('Client tracking link copied!', 'Link Copied');
            }}
          >
            <Link2 className="w-3.5 h-3.5" /> Copy Client Link
          </Button>
        )}
      </div>
    </div>
  );
}
