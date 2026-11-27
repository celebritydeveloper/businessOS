import { Printer, X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { CreativeProjectItem } from './Creative.types';

interface ProjectInvoiceModalProps {
  project: CreativeProjectItem | null;
  businessName: string;
  branchName: string;
  showPoweredBy?: boolean;
  onClose: () => void;
}

export function ProjectInvoiceModal({
  project,
  businessName,
  branchName,
  showPoweredBy = true,
  onClose,
}: ProjectInvoiceModalProps) {
  if (!project) return null;

  const quote = Number(project.contract_amount || 0);
  const paid = Number(project.amount_paid || 0);
  const balance = Math.max(0, quote - paid);
  const paymentLogs = project.logs.filter((l) => l.log_type === 'payment' || l.log_type === 'retainer_renewal');
  const invoiceNo = `INV-${project.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-xl space-y-6 print:border-0 print:shadow-none print:max-w-none">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
          <h2 className="text-sm font-bold text-slate-900">Client Invoice &amp; Payment Receipt</h2>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{businessName}</h1>
              <p className="text-xs text-slate-500">{branchName}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                {balance <= 0 ? 'Paid Receipt' : 'Project Invoice'}
              </span>
              <p className="text-xs font-mono text-slate-500 mt-1">{invoiceNo}</p>
              <p className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString('en-NG')}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-400">Billed To</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{project.customer_name || 'Valued Client'}</p>
              {project.customer_phone && <p className="text-slate-500">{project.customer_phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Project Scope</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{project.title}</p>
              <p className="text-slate-500 capitalize">
                {project.project_type === 'monthly_retainer' ? `Monthly Retainer (${project.billing_cycle_label || 'Active'})` : 'Fixed Project Quote'}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[11px]">
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-right">Amount (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3">
                  <p className="font-bold text-slate-900">{project.title}</p>
                  {project.notes && <p className="text-slate-500 mt-0.5">{project.notes}</p>}
                </td>
                <td className="py-3 text-right font-mono font-bold">
                  ₦{quote.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {paymentLogs.map((log) => (
                <tr key={log.id} className="text-emerald-700">
                  <td className="py-2.5">
                    {log.title} <span className="text-[11px] text-slate-400">({new Date(log.created_at).toLocaleDateString('en-NG')})</span>
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    − ₦{Number(log.cost_amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-slate-200 pt-4 space-y-1.5 text-xs max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Total:</span>
              <span className="font-mono font-semibold">₦{quote.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Total Paid:</span>
              <span className="font-mono font-semibold">₦{paid.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {showPoweredBy && (
            <div className="pt-6 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                Powered by <strong className="text-slate-600">BusinessOS</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
