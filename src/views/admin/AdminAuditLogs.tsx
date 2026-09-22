import React, { useEffect, useState } from 'react';
import { History, Search, ArrowLeft, Filter, ShieldCheck } from 'lucide-react';
import { getAuditLogs } from '../../services/apiService';
import { AuditLog } from '../../types';

interface AdminAuditLogsProps {
  onNavigate: (view: string) => void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      log.action.toLowerCase().includes(q) ||
      (log.candidateId && log.candidateId.toLowerCase().includes(q)) ||
      log.adminEmail.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q));

    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchQuery && matchAction;
  });

  return (
    <div id="admin-audit-logs-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Audit Trails</h1>
          <p className="text-sm text-slate-600 mt-1">
            Immutable log of administrative operations, change approvals, marksheet publications, and schedule modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Tamper-Resistant Log
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, admin email, candidate ID, or detail..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-semibold"
          >
            <option value="ALL">All Event Types</option>
            <option value="APPROVE_DATE_CHANGE">Approve Date Change</option>
            <option value="REJECT_DATE_CHANGE">Reject Date Change</option>
            <option value="APPROVE_CENTER_CHANGE">Approve Center Change</option>
            <option value="REJECT_CENTER_CHANGE">Reject Center Change</option>
            <option value="ISSUE_MARKSHEET">Issue Marksheet</option>
            <option value="CREATE_CANDIDATE">Create Candidate</option>
            <option value="UPDATE_CANDIDATE">Update Candidate</option>
            <option value="DELETE_CANDIDATE">Delete Candidate</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Loading audit event stream...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">No audit logs recorded for this criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Candidate ID</th>
                  <th className="py-3 px-4">Previous State</th>
                  <th className="py-3 px-4">New State</th>
                  <th className="py-3 px-4">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                      {log.adminEmail}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">{log.candidateId || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate">
                      {log.previousValue || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold max-w-[140px] truncate">
                      {log.newValue || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans text-xs max-w-[220px]">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
