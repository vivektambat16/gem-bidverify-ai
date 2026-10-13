import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BuildingIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClockIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
  ShieldCheckIcon,
  SquareCheckBigIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const riskColors = { Low: '#14B8A6', Medium: '#F59E0B', High: '#F43F5E', Critical: '#991B1B' };

const chartPalette = ['#14B8A6', '#F59E0B', '#F43F5E'];

export const DashboardPage = () => {
  const { user: e } = useAuth(),
    [t, r] = useState(null),
    [n, i] = useState(true),
    [a, o] = useState(''),
    [l, c] = useState('ALL'),
    [loadError, setLoadError] = useState('');
  useEffect(() => {
    u();
  }, []);
  const u = async () => {
    try {
      i(true);
      setLoadError('');
      const h = await api.getDashboardStats();
      r(h);
    } catch (h) {
      console.error(h);
      setLoadError(h && h.message ? h.message : 'The dashboard could not be loaded.');
    } finally {
      i(false);
    }
  };
  if (!n && !t)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm font-bold text-rose-700">Could not load the dashboard</p>
          <p className="text-xs text-slate-600">{loadError}</p>
          <p className="text-xs text-slate-500">
            Check that the backend window is running (http://127.0.0.1:8000/api/health), then try
            again.
          </p>
          <button
            onClick={u}
            className="px-4 py-2 bg-pine-800 text-white text-xs font-bold rounded-xl"
          >
            Try again
          </button>
        </div>
      </div>
    );
  if (n || !t)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-pine-800 border-t-champagne-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            Loading GeM Technical Evaluation Intelligence...
          </p>
        </div>
      </div>
    );
  const f = Object.entries(t.compliance_overview).map(([h, y]) => ({ name: h, value: y })),
    d = Object.entries(t.risk_distribution).map(([h, y]) => ({ name: h, value: y })),
    p = t.recent_bids.filter((h) => {
      const y =
          h.bidder_name.toLowerCase().includes(a.toLowerCase()) ||
          h.tender_id.toLowerCase().includes(a.toLowerCase()) ||
          h.bid_id.toLowerCase().includes(a.toLowerCase()),
        x = l === 'ALL' || h.risk_level === l;
      return y && x;
    });
  return (
    <div className="space-y-6">
      <div className="relative gradient-pine-hero rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden border border-pine-700/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-pine-500/10 via-champagne-500/5 to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-champagne-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-sm">
                GFR 2017 AI Matrix
              </span>
              <span className="text-pine-200 text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pine-400 animate-pulse" />
                Deterministic Technical Scrutiny Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {'Welcome, '}
              <span className="text-champagne-300">
                {(e == null ? undefined : e.full_name) || 'Rajesh Kumar Verma'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl leading-relaxed">
              Real-time decision support gateway active across GSTN, MCA21, Udyam, Income Tax e-PAN,
              and Central Debarment registers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/tenders"
              className="px-4 py-2.5 bg-gradient-to-r from-champagne-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-glow-champagne transition-all flex items-center gap-2 group"
            >
              <FileTextIcon className="w-4 h-4 text-slate-950" />
              <span>Create Tender</span>
              <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/bids"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 shadow transition-all flex items-center gap-2"
            >
              <SquareCheckBigIcon className="w-4 h-4 text-pine-300" />
              <span>Verify Bids</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Total Tenders
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileTextIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {t.total_tenders}
          </p>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">
            In Master Registry
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-b-2xl" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Active Tenders
            </span>
            <div className="w-8 h-8 rounded-xl bg-pine-50 text-pine-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayersIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-pine-700 font-mono">
            {t.active_tenders}
          </p>
          <span className="text-[10px] text-pine-600 font-medium mt-1 block">Open for Bidding</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-pine-600 rounded-b-2xl" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Under Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
            {t.bids_under_verification}
          </p>
          <span className="text-[10px] text-indigo-600 font-medium mt-1 block">
            AI Pipeline Active
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-b-2xl" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Verified Bids
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <SquareCheckBigIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
            {t.verified_bids}
          </p>
          <span className="text-[10px] text-teal-600 font-medium mt-1 block">Scrutiny Passed</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-b-2xl" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              High / Critical
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TriangleAlertIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
            {t.high_risk_bids}
          </p>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">
            Flagged Discrepancy
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-b-2xl" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Sign-off
            </span>
            <div className="w-8 h-8 rounded-xl bg-champagne-100 text-champagne-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUpIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-champagne-700 font-mono">
            {t.pending_reviews}
          </p>
          <span className="text-[10px] text-champagne-700 font-medium mt-1 block">
            Awaiting Officer
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-champagne-500 rounded-b-2xl" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-soft overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pine-50 text-pine-800 flex items-center justify-center font-bold">
              <LayersIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Tenders In Progress
                <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {t.active_tenders}
                  {' Active'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Live evaluation status of ongoing GeM procurement packages
              </p>
            </div>
          </div>
          <Link
            to="/tenders"
            className="text-xs font-bold text-pine-700 hover:text-pine-900 flex items-center gap-1 hover:underline"
          >
            <span>Manage All Tenders</span>
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Tender ID</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">{'Title & Dept'}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Estimated Value</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Deadline</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Bids Count</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Evaluation Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {t.recent_bids.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {'No active tenders. '}
                    <Link to="/tenders" className="text-pine-700 font-bold underline">
                      Create one now →
                    </Link>
                  </td>
                </tr>
              ) : (
                Array.from(new Map(t.recent_bids.map((h) => [h.tender_id, h])).values())
                  .slice(0, 6)
                  .map((h, y) => {
                    const x = Math.max(
                        0,
                        Math.round((new Date(h.last_verified).getTime() - Date.now()) / 864e5) + 14,
                      ),
                      g =
                        h.risk_level === 'LOW'
                          ? 'bg-emerald-100 text-emerald-800'
                          : h.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800';
                    return (
                      <tr key={y} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {h.tender_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{h.bidder_name}</p>
                          <p className="text-[10px] text-slate-500">
                            {'Ministry of Electronics & IT'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          ₹{(50 + y * 12.5).toFixed(1)}
                          {' Lakhs'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-semibold ${x <= 3 ? 'text-rose-600' : 'text-slate-700'}`}
                          >
                            {x}
                            {' days remaining'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{h.documents_count}</span>
                          <span className="text-slate-500 ml-1">bids</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${g}`}
                          >
                            {h.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/bids/${h.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-pine-50 hover:bg-pine-800 text-pine-900 hover:text-white font-bold rounded-xl transition-all border border-pine-200 shadow-sm text-[11px]"
                          >
                            <span>Review</span>
                            <ArrowUpRightIcon className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card-soft">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Compliance Breakdown
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
              GFR 149
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Threshold status across registered bids</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={f}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={6}
                >
                  {f.map((h, y) => (
                    <Cell key={`cell-${y}`} fill={chartPalette[y % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card-soft">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Risk Categorization
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
              AI Scored
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            {'Multi-factor fraud & statutory discrepancy index'}
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="value" name="Bids" radius={[6, 6, 0, 0]}>
                  {d.map((h) => (
                    <Cell key={h.name} fill={riskColors[h.name] || '#0D9488'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card-soft">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Verification Activity
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
              Last 6 Days
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">Daily verified vs flagged submissions</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t.verification_activity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748B" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="verified" name="Verified" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SquareCheckBigIcon className="w-4 h-4 text-pine-700" />
              Submitted Bids Under Technical Scrutiny
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic verification results, statutory cross-checks, and officer sign-off
              status
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Bidder, Tender ID..."
                value={a}
                onChange={(h) => o(h.target.value)}
                className="text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none w-full sm:w-60"
              />
            </div>
            <select
              value={l}
              onChange={(h) => c(h.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">
                  {'Bidder & Entity'}
                </th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Tender ID</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Docs</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Compliance Score</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Risk Level</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Evaluation Status</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Last Verified</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {p.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No bids match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                p.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center border border-teal-200 flex-shrink-0">
                          <BuildingIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{h.bidder_name}</p>
                          <span className="text-[10px] font-mono text-slate-400">{h.bid_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {h.tender_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-bold">
                        {h.documents_count}
                        {' Files'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${h.compliance_score >= 80 ? 'bg-teal-500' : h.compliance_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${h.compliance_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {h.compliance_score}/100
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${h.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' : h.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}
                      >
                        {h.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${h.status === 'APPROVED' ? 'text-emerald-700' : h.status === 'REJECTED' ? 'text-rose-700' : h.status === 'VERIFIED' ? 'text-teal-700' : 'text-amber-700'}`}
                      >
                        {h.status === 'APPROVED' && (
                          <CircleCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {h.status === 'REJECTED' && (
                          <CircleXIcon className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        {h.status === 'VERIFIED' && (
                          <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        {h.status === 'REQUIRES_CLARIFICATION' && (
                          <CircleHelpIcon className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {h.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {h.last_verified}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/bids/${h.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-pine-50 hover:bg-pine-800 text-pine-900 hover:text-white font-bold rounded-xl transition-all border border-pine-200 shadow-sm"
                      >
                        <span>Verify Bid</span>
                        <ArrowUpRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </td>
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
