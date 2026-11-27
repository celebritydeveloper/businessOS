import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, CheckSquare, Circle, Clock, Square, User } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import type { ProjectStage, PublicClientProject } from './Creative.types';

const STAGES: Array<{ key: ProjectStage; label: string }> = [
  { key: 'brief', label: 'Brief' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'client_review', label: 'Review' },
  { key: 'revisions', label: 'Revisions' },
  { key: 'delivered', label: 'Delivered' },
];

export function ClientProjectTrackerPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [project, setProject] = useState<PublicClientProject | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ project: PublicClientProject }>(`/public/projects/${encodeURIComponent(token)}`).then((res) => {
      if (res.ok && res.body.data) {
        setProject(res.body.data.project);
      } else {
        setError(res.body.message || 'Project tracking link not found.');
      }
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Loading project progress...</div>;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center space-y-2">
          <p className="text-base font-bold text-slate-900">Link Unavailable</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const brandName = project.app_name || project.business_name;
  const brandColor = project.primary_color || '#0f4ef0';
  const currentIdx = STAGES.findIndex((s) => s.key === project.stage);
  const quote = Number(project.contract_amount || 0);
  const paid = Number(project.amount_paid || 0);
  const balance = Math.max(0, quote - paid);
  const deliverables = project.logs.filter((l) => l.log_type === 'deliverable');
  const history = project.logs.filter((l) => l.log_type !== 'deliverable');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {project.logo_url && <img src={project.logo_url} alt={brandName} className="w-9 h-9 rounded-lg object-cover" />}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: brandColor }}>{brandName}</p>
                <h1 className="text-lg font-bold text-slate-900">{project.title}</h1>
                {project.customer_name && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Prepared for <strong className="text-slate-700">{project.customer_name}</strong>
                  </p>
                )}
              </div>
            </div>
            {project.due_date && (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Due {project.due_date}
              </span>
            )}
          </div>

          {/* Stage Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {STAGES.map((st, idx) => {
              const passed = idx <= currentIdx;
              return (
                <div key={st.key} className="space-y-1 text-center">
                  <div className="h-2 rounded-full transition-colors" style={{ backgroundColor: passed ? brandColor : '#e2e8f0' }} />
                  <p className={`text-[10px] sm:text-xs font-semibold ${passed ? 'text-slate-900' : 'text-slate-400'}`}>
                    {st.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <p className="text-[11px] text-slate-500">Contract / Paid</p>
              <p className="font-bold text-slate-900">₦{quote.toLocaleString('en-NG')} / <span className="text-emerald-700">₦{paid.toLocaleString('en-NG')}</span></p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Balance Due</p>
              <p className={`font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>₦{balance.toLocaleString('en-NG')}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Revisions Used</p>
              <p className="font-bold text-slate-900">{project.revisions_used} / {project.revisions_included}</p>
            </div>
          </div>


          {project.delivery_url && (
            <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3" style={{ borderColor: brandColor, backgroundColor: '#f8fafc' }}>
              <div>
                <p className="text-xs font-bold text-slate-900">Final Project Files Ready</p>
                <p className="text-[11px] text-slate-500">Access your approved deliverables via the cloud link below.</p>
              </div>
              <a
                href={project.delivery_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: brandColor }}
              >
                Open Deliverables
              </a>
            </div>
          )}


          {deliverables.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Deliverables Checklist</p>
              <div className="space-y-1.5">
                {deliverables.map((d) => {
                  const done = Boolean(Number(d.is_completed));
                  return (
                    <div key={d.id} className="flex items-center gap-2 text-xs py-1">
                      {done ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                      <span className={done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>{d.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Milestone &amp; Payment Trail</p>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5">
                      {h.log_type === 'payment' || h.log_type === 'retainer_renewal'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        : <Circle className="w-3 h-3 text-slate-400 shrink-0" />}
                      {h.title}
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
