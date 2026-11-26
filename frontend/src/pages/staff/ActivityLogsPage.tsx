import { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { ActivityLogItem, ActivityLogsResponse } from './Staff.types';

export function ActivityLogsPage() {
  const { activeBusiness } = useAuth();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const res = await apiFetch<ActivityLogsResponse>(`/workspace/businesses/${activeBusiness.id}/audit-logs`);
    if (res.ok && res.body.data) setLogs(res.body.data.logs);
    setLoading(false);
  }, [activeBusiness?.id]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  if (!activeBusiness) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Activity &amp; Security Audit Logs</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Immutable operational trail for <strong>{activeBusiness.name}</strong>
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Staff / Actor</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-brand-600" /> {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.actor_name || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.actor_name || 'System'}</span>
                      {log.actor_role && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {log.actor_role}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">{log.branch_name || 'All Branches'}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip_address || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
