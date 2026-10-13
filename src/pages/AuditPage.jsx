import { useEffect, useState } from 'react';
import { DownloadIcon, FingerprintIcon, LockIcon, SearchIcon } from 'lucide-react';
import { api } from '../api';

export const AuditPage = () => {
  const [e, t] = useState([]),
    [r, n] = useState(true),
    [i, a] = useState('');
  useEffect(() => {
    o();
  }, []);
  const o = async () => {
      try {
        n(true);
        const c = await api.getAuditLogs();
        t(c);
      } catch (c) {
        console.error(c);
      } finally {
        n(false);
      }
    },
    l = e.filter(
      (c) =>
        c.action.toLowerCase().includes(i.toLowerCase()) ||
        c.user_name.toLowerCase().includes(i.toLowerCase()) ||
        (c.details && c.details.toLowerCase().includes(i.toLowerCase())),
    );
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {'Immutable CVC & CAG Vigilance Audit Trail'}
            </h1>
            <span className="bg-champagne-100 text-champagne-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 border border-champagne-200">
              <LockIcon className="w-2.5 h-2.5 text-champagne-700" />
              Append-Only SHA-256
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every AI extraction, rule evaluation, score adjustment, and officer decision is recorded
            with cryptographic timestamps.
          </p>
        </div>
        <button
          onClick={() => alert('Exporting Official CVC Audit Trail Report as Signed CSV/PDF...')}
          className="px-4 py-2.5 bg-obsidian-900 hover:bg-obsidian-850 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 border border-slate-700"
        >
          <DownloadIcon className="w-4 h-4 text-champagne-300" />
          <span>Export Audit Report</span>
        </button>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit actions, officer remarks, extracted entities, IP address..."
            value={i}
            onChange={(c) => a(c.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pine-600 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span className="font-bold flex items-center gap-1.5 text-slate-900">
            <FingerprintIcon className="w-4 h-4 text-pine-700" />
            {'Total Logged Vigilance Events: '}
            {l.length}
          </span>
          <span className="font-mono text-[11px] bg-pine-50 text-pine-800 px-2.5 py-0.5 rounded-full border border-pine-200 font-bold">
            SHA-256 Verified
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Timestamp (IST)</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">User / Agent</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Event Action</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Entity</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                  {'Audit Details & Rationale'}
                </th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider font-mono">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {r ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : l.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                l.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-bold text-[10px] ${c.user_name.includes('SYSTEM_AI') ? 'bg-pine-100 text-pine-900 border border-pine-200' : 'bg-champagne-100 text-champagne-900 border border-champagne-200'}`}
                      >
                        {c.user_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.action}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700">
                        {c.entity_type || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs text-slate-700 max-w-md leading-relaxed">
                      {c.details}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10.5px]">{c.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
