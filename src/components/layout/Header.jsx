import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  CalendarIcon,
  DatabaseIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
  MenuIcon,
  OctagonAlertIcon,
  RefreshCwIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { api } from '../../api';

export const Header = () => {
  var j;
  const { user: e } = useAuth(),
    { isExpanded: t, toggleSidebar: r } = useSidebar(),
    [n, i] = useState([]),
    [a, o] = useState(false),
    [l, c] = useState(false),
    [u, f] = useState(''),
    [d, p] = useState(''),
    h = useRef(null),
    y = useRef(null);
  useEffect(() => {
    (x(),
      p(
        new Date().toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      ));
    const _ = (S) => {
      h.current && !h.current.contains(S.target) && o(false);
    };
    return (
      document.addEventListener('mousedown', _),
      () => document.removeEventListener('mousedown', _)
    );
  }, []);
  const x = async () => {
      try {
        const w = await api.getNotifications();
        i(w);
      } catch (w) {
        console.error(w);
      }
    },
    g = async () => {
      try {
        const w = await api.exportData(),
          _ = new Blob([JSON.stringify(w, null, 2)], { type: 'application/json' }),
          S = URL.createObjectURL(_),
          O = document.createElement('a');
        ((O.href = S),
          (O.download = `gem_bidverify_data_backup_${new Date().toISOString().slice(0, 10)}.json`),
          document.body.appendChild(O),
          O.click(),
          document.body.removeChild(O),
          URL.revokeObjectURL(S),
          f('✅ Data package successfully exported as JSON file!'));
      } catch (w) {
        f(`❌ Export failed: ${w.message}`);
      }
    },
    v = (w) => {
      var O;
      const _ = (O = w.target.files) == null ? undefined : O[0];
      if (!_) return;
      const S = new FileReader();
      ((S.onload = async (A) => {
        var E;
        try {
          const T = JSON.parse((E = A.target) == null ? undefined : E.result);
          (await api.importData(T),
            f('✅ All data successfully imported! Refreshing page...'),
            setTimeout(() => window.location.reload(), 1200));
        } catch (T) {
          f(`❌ Import failed: ${T.message}`);
        }
      }),
        S.readAsText(_));
    },
    m = async () => {
      if (
        window.confirm(
          'Reset all tenders, bidders, bids, and audit logs to the official GFR 2017 baseline data?',
        )
      ) {
        try {
          await api.resetData();
          f('✅ Baseline data restored! Refreshing...');
          setTimeout(() => window.location.reload(), 1e3);
        } catch (w) {
          f(`❌ Reset failed: ${w.message}`);
        }
      }
    },
    b = n.filter((w) => !w.is_read).length;
  return (
    <header className="sticky top-0 z-50 shadow-xl select-none">
      <div className="bg-[#03080F] px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center text-[11px] border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="font-bold tracking-wider text-champagne-400 uppercase">
            {'भारत सरकार '}
            <span className="font-normal text-slate-400">| Government of India</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 font-medium hidden sm:inline">
            {'Ministry of Commerce & Industry'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10.5px]">
            <CalendarIcon className="w-3 h-3 text-slate-500" />
            <span className="text-slate-300 font-medium">{d}</span>
          </div>
        </div>
      </div>
      <div className="bg-[#08121E] text-white px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-800/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={r}
            className="p-2 rounded-xl bg-[#0C1A2B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-champagne-400 transition-all shadow-sm flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-pine-500/50"
            title={t ? 'Collapse Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)'}
            aria-label="Toggle Navigation Sidebar"
          >
            <MenuIcon
              className={`w-4 h-4 transition-transform duration-200 ${t ? 'text-champagne-400' : 'text-slate-300 group-hover:scale-110'}`}
            />
          </button>
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F2620] via-[#0A1A24] to-[#040E14] border border-champagne-400/40 p-1.5 flex items-center justify-center shadow-lg group-hover:border-champagne-400 transition-all duration-200">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z"
                  fill="url(#brand-shield)"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="7" r="1.1" fill="#14B8A6" />
                <defs>
                  <linearGradient
                    id="brand-shield"
                    x1="12"
                    y1="2"
                    x2="12"
                    y2="23"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#0D3830" />
                    <stop offset="1" stopColor="#08231E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-champagne-300 transition-colors">
                  {'GeM '}
                  <span className="text-champagne-400">BidVerify</span>
                </span>
                <span className="bg-pine-800/90 text-pine-300 text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono shadow-sm border border-pine-600/50 flex items-center gap-1">
                  <SparklesIcon className="w-2.5 h-2.5 text-champagne-300" />
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                {'National Public Procurement Compliance & Technical Evaluation Matrix'}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              (c(true), f(''));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C1A2B] hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-champagne-400 transition-all text-xs font-semibold shadow-sm"
            title="Backup, export, or sync procurement data across devices"
          >
            <DatabaseIcon className="w-3.5 h-3.5 text-champagne-400" />
            <span className="hidden md:inline">Sync Data</span>
          </button>
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-pine-700 via-teal-800 to-pine-900 border border-slate-700/80 hover:border-champagne-400/60 flex items-center justify-center font-bold text-sm text-white shadow-md transition-all cursor-pointer relative group"
            title={`${(e == null ? undefined : e.full_name) || 'Rajesh Kumar Verma'} • ${(e == null ? undefined : e.role) || 'Procurement Officer'}`}
          >
            <span>
              {((j = e == null ? undefined : e.full_name) == null ? undefined : j.charAt(0)) || 'R'}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-champagne-400 rounded-full border-2 border-[#08121E] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-pine-900 rounded-full" />
            </span>
          </div>
          <div className="relative" ref={h}>
            <button
              onClick={() => o(!a)}
              className="p-2 rounded-xl bg-[#0C1A2B] hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors relative shadow-sm"
              title={'Vigilance Alerts & Notifications'}
            >
              <BellIcon className="w-4 h-4" />
              {b > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {b}
                </span>
              )}
            </button>
            {a && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 bg-[#08121E] text-white flex justify-between items-center border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BellIcon className="w-4 h-4 text-champagne-400" />
                    <span className="font-bold text-xs">{'Vigilance & Verification Alerts'}</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {n.length}
                    {' Total'}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {n.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No active vigilance notifications
                    </div>
                  ) : (
                    n.map((w) => (
                      <div
                        key={w.id}
                        className={`p-3.5 hover:bg-slate-50 flex items-start gap-3 transition-colors ${w.is_read ? '' : 'bg-teal-50/40'}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {w.category === 'HIGH_RISK' ? (
                            <OctagonAlertIcon className="w-4 h-4 text-rose-600" />
                          ) : w.category === 'WARNING' ? (
                            <TriangleAlertIcon className="w-4 h-4 text-champagne-600" />
                          ) : (
                            <InfoIcon className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {w.title}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {w.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {new Date(w.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to="/bids"
                    onClick={() => o(false)}
                    className="text-xs text-pine-700 font-bold hover:underline flex items-center justify-center gap-1"
                  >
                    <span>View All Live Bids Under Review</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {l && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800">
            <div className="px-6 py-4 bg-gradient-to-r from-[#060D17] to-[#0D3830] text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <DatabaseIcon className="w-5 h-5 text-champagne-400" />
                <h3 className="text-sm font-bold">{'Cross-Device Data Backup & Sync'}</h3>
              </div>
              <button
                onClick={() => c(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Save or transfer your complete evaluation dataset (tenders, registered bidders,
                bids, compliance scores, and audit records) to any browser or device.
              </p>
              {u && (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-800 font-semibold text-xs">
                  {u}
                </div>
              )}
              <input type="file" ref={y} onChange={v} accept=".json" className="hidden" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={g}
                  className="p-3.5 rounded-2xl bg-pine-50 hover:bg-pine-100 border border-pine-200 text-pine-900 font-bold flex flex-col items-center gap-1.5 transition-all text-center shadow-sm"
                >
                  <DownloadIcon className="w-5 h-5 text-pine-700" />
                  <span>Export All Data (JSON)</span>
                  <span className="text-[10px] text-pine-600 font-normal">
                    Download complete backup
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    var w;
                    return (w = y.current) == null ? undefined : w.click();
                  }}
                  className="p-3.5 rounded-2xl bg-champagne-50 hover:bg-champagne-100 border border-champagne-200 text-champagne-950 font-bold flex flex-col items-center gap-1.5 transition-all text-center shadow-sm"
                >
                  <UploadIcon className="w-5 h-5 text-champagne-700" />
                  <span>Import Data Package</span>
                  <span className="text-[10px] text-champagne-700 font-normal">
                    Restore from JSON file
                  </span>
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={m}
                  className="text-rose-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  {' Reset to Baseline GFR Data'}
                </button>
                <button
                  type="button"
                  onClick={() => c(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
