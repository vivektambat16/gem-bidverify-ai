import { NavLink } from 'react-router-dom';
import {
  Building2Icon,
  ChevronLeftIcon,
  CpuIcon,
  FileTextIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  NetworkIcon,
  ShieldCheckIcon,
  SquareCheckBigIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboardIcon },
  { path: '/tenders', label: 'Tenders & Criteria', icon: FileTextIcon },
  { path: '/bidders', label: 'Bidder Registry', icon: Building2Icon },
  { path: '/bids', label: 'Bid Verification', icon: SquareCheckBigIcon, badge: 'AI Live' },
  { path: '/integrations', label: 'Portal Connectors', icon: NetworkIcon, badge: '14' },
  { path: '/audit', label: 'CVC Audit Trail', icon: HistoryIcon },
];

export const Sidebar = () => {
  var o, l;
  const { user: e, logout: t } = useAuth(),
    { isExpanded: r, toggleSidebar: n, isMobileOpen: i, toggleMobile: a } = useSidebar();
  return (
    <>
      {i && (
        <div
          onClick={a}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
      <aside
        className={`bg-[#060D17] text-slate-300 flex-shrink-0 min-h-[calc(100vh-4.75rem)] flex flex-col border-r border-slate-800/90 select-none shadow-2xl transition-all duration-300 ease-in-out z-40 ${r ? 'w-64' : 'w-[72px]'} ${i ? 'fixed inset-y-0 left-0 z-50 translate-x-0' : 'max-md:-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-3.5 py-3.5 flex items-center justify-between border-b border-slate-800/80 bg-[#07111E]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <button
              onClick={n}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-champagne-400 transition-all border border-slate-800 flex-shrink-0 group shadow-sm focus:outline-none focus:ring-2 focus:ring-pine-500/50"
              title={r ? 'Collapse Sidebar (Ctrl+B)' : 'Expand Sidebar (Ctrl+B)'}
              aria-label="Toggle Sidebar"
            >
              <MenuIcon
                className={`w-4 h-4 transition-transform duration-300 ${r ? 'text-champagne-400 rotate-90' : 'text-slate-300 group-hover:scale-110'}`}
              />
            </button>
            {r && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-widest font-mono truncate block">
                  Navigation
                </span>
                <span className="text-[9px] text-champagne-400/80 font-mono block">
                  GFR 2017 Matrix
                </span>
              </div>
            )}
          </div>
          {r && (
            <button
              onClick={n}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Collapse Panel (Ctrl+B)"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto custom-scrollbar space-y-1.5">
          {navItems.map((c) => {
            const u = c.icon;
            return (
              <NavLink
                key={c.path}
                to={c.path}
                end={c.path === '/'}
                className={({ isActive: f }) =>
                  `group relative flex items-center ${r ? 'justify-between px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-xs font-semibold transition-all duration-200 ${f ? 'bg-gradient-to-r from-pine-900/90 via-pine-800/80 to-teal-900/70 text-white shadow-glow-teal border border-pine-600/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`
                }
              >
                {({ isActive: f }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <u
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${f ? 'text-champagne-400' : 'text-slate-400 group-hover:text-champagne-300 group-hover:scale-110'}`}
                      />
                      {r && <span className="truncate font-medium tracking-wide">{c.label}</span>}
                    </div>
                    {c.badge && r && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase font-mono shadow-sm flex-shrink-0 ${c.badge === 'AI Live' ? 'bg-champagne-400 text-slate-950 shadow-glow-champagne' : 'bg-slate-800 text-teal-300 border border-teal-700/50'}`}
                      >
                        {c.badge}
                      </span>
                    )}
                    {!r && (
                      <div className="absolute left-[76px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0A1826] text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700/90 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 whitespace-nowrap flex items-center gap-2">
                        <span>{c.label}</span>
                        {c.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-champagne-400 text-slate-950 font-mono">
                            {c.badge}
                          </span>
                        )}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0A1826]" />
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-800/90 p-2.5 space-y-2 bg-[#040911]">
          {r ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] text-slate-400 bg-[#08121E] rounded-xl border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2">
                <CpuIcon className="w-3.5 h-3.5 text-pine-400" />
                <span className="font-mono text-slate-300 font-semibold">
                  GFR Rule 149 AI Engine
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-pine-400 animate-pulse shadow-glow-teal" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center py-2 bg-[#08121E] rounded-xl border border-slate-800/80 cursor-pointer group relative"
              title="GFR Rule 149 AI Engine Active"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-pine-400 animate-pulse shadow-glow-teal" />
              <div className="absolute left-[76px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0A1826] text-[10px] font-mono text-pine-300 rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                GFR Rule 149 Active
              </div>
            </div>
          )}
          {r ? (
            <div className="bg-[#08121E] rounded-xl border border-slate-800 p-2.5 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pine-700 to-teal-800 flex items-center justify-center font-bold text-xs text-white shadow-inner flex-shrink-0">
                  {((o = e == null ? undefined : e.full_name) == null ? undefined : o.charAt(0)) ||
                    'R'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold text-white truncate flex items-center gap-1">
                    {(e == null ? undefined : e.full_name) || 'Rajesh Verma'}
                    <ShieldCheckIcon className="w-3 h-3 text-champagne-400 flex-shrink-0" />
                  </p>
                  <p className="text-[10px] text-champagne-300/90 truncate font-medium">
                    {(e == null ? undefined : e.role) || 'Procurement Officer'}
                  </p>
                </div>
              </div>
              <button
                onClick={t}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-colors flex-shrink-0"
                title="Sign Out of GeM"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pine-700 to-teal-800 flex items-center justify-center font-bold text-xs text-white shadow-inner cursor-pointer group relative">
                {((l = e == null ? undefined : e.full_name) == null ? undefined : l.charAt(0)) ||
                  'R'}
                <div className="absolute left-[76px] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#0A1826] text-xs text-white rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {(e == null ? undefined : e.full_name) || 'Rajesh Verma'}
                </div>
              </div>
              <button
                onClick={t}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOutIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
