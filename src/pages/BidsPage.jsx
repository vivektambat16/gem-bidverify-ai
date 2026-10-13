import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRightIcon,
  BuildingIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClipboardListIcon,
  CpuIcon,
  FileTextIcon,
  IndianRupeeIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { api } from '../api';

export const BidsPage = () => {
  const [e, t] = useState('all'),
    [r, n] = useState([]),
    [i, a] = useState([]),
    [o, l] = useState(true),
    [c, u] = useState(''),
    [f, d] = useState('ALL'),
    [p, h] = useState(''),
    [y, x] = useState(''),
    [g, v] = useState([]),
    [m, b] = useState(''),
    [j, w] = useState(false),
    [_, S] = useState(''),
    [O, A] = useState('');
  useEffect(() => {
    E();
  }, []);
  const E = async () => {
      l(true);
      try {
        const [P, $, D] = await Promise.all([api.getTenders(), api.getBids(), api.getBidders()]);
        (n(P), a($), v(D), P.length > 0 && h(String(P[0].id)));
      } catch (P) {
        console.error(P);
      } finally {
        l(false);
      }
    },
    T = async (P) => {
      if ((P.preventDefault(), !p || !m)) {
        A('Please select both a Tender and a Bidder.');
        return;
      }
      (w(true), A(''), S(''));
      try {
        (await api.createBid({ tender_id: Number(p), bidder_id: Number(m) }),
          S('Bid registered successfully! It will appear in the All Bids list.'),
          await E(),
          setTimeout(() => t('all'), 1800));
      } catch ($) {
        A($.message || 'Failed to submit bid.');
      } finally {
        w(false);
      }
    },
    C = i.filter((P) => {
      const $ =
          (P.bidder_name || '').toLowerCase().includes(c.toLowerCase()) ||
          (P.tender_id || '').toLowerCase().includes(c.toLowerCase()) ||
          (P.bid_id || '').toLowerCase().includes(c.toLowerCase()),
        D = f === 'ALL' || (P.risk_level || '') === f;
      return $ && D;
    }),
    I = g.filter((P) => P.company_name.toLowerCase().includes(y.toLowerCase())),
    R = [
      { id: 'all', label: 'All Bids Under Verification', icon: ClipboardListIcon },
      { id: 'submit', label: 'Submit / Register New Bid', icon: PlusIcon },
    ];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {'Bid Compliance & Verification Matrix'}
              </h1>
              <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                <SparklesIcon className="w-2.5 h-2.5 text-pine-600" />
                AI Scrutiny
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review multi-source statutory evaluations, OCR document extractions, and sign off
              official determinations.
            </p>
          </div>
          <button
            onClick={() => t('submit')}
            className="px-4 py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4 text-champagne-300" />
            <span>Register New Bid</span>
          </button>
        </div>
        <div className="flex gap-2 mt-5 border-b border-slate-200">
          {R.map((P) => {
            const $ = P.icon;
            return (
              <button
                key={P.id}
                onClick={() => t(P.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all ${e === P.id ? 'border-pine-700 text-pine-900 bg-pine-50/70 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <$ className="w-3.5 h-3.5" />
                {P.label}
              </button>
            );
          })}
        </div>
      </div>
      {e === 'all' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-soft overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submitted Bids Under Technical Scrutiny
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic AI evaluation results, cross-checks, and officer sign-off.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bidder, tender ID…"
                  value={c}
                  onChange={(P) => u(P.target.value)}
                  className="text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none w-full sm:w-56"
                />
              </div>
              <select
                value={f}
                onChange={(P) => d(P.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>
          </div>
          {o ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-8 h-8 border-4 border-pine-800 border-t-champagne-400 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading submitted bids...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      {'Bidder & Entity'}
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Tender ID</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Docs</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Compliance Score
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Risk Level</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">
                      Evaluation Status
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Last Verified</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {C.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {'No bids match the filter. '}
                        <button
                          onClick={() => t('submit')}
                          className="text-pine-700 font-bold underline"
                        >
                          Register a new bid →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    C.map((P) => (
                      <tr key={P.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 font-bold flex items-center justify-center border border-teal-200 flex-shrink-0">
                              <BuildingIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{P.bidder_name}</p>
                              <span className="text-[10px] font-mono text-slate-400">
                                {P.bid_id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {P.tender_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-bold">
                            {P.documents_count}
                            {' Files'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${P.compliance_score >= 80 ? 'bg-teal-500' : P.compliance_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${P.compliance_score}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                              {P.compliance_score}/100
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${P.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' : P.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}
                          >
                            {P.risk_level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${P.status === 'APPROVED' ? 'text-emerald-700' : P.status === 'REJECTED' ? 'text-rose-700' : P.status === 'VERIFIED' ? 'text-teal-700' : 'text-amber-700'}`}
                          >
                            {P.status === 'APPROVED' && (
                              <CircleCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {P.status === 'REJECTED' && (
                              <CircleXIcon className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            {P.status === 'VERIFIED' && (
                              <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600" />
                            )}
                            {P.status === 'REQUIRES_CLARIFICATION' && (
                              <CircleHelpIcon className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {P.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {P.last_verified}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/bids/${P.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-pine-50 hover:bg-pine-800 text-pine-900 hover:text-white font-bold rounded-xl transition-all border border-pine-200 shadow-sm text-[11px]"
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
          )}
        </div>
      )}
      {e === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-card-soft p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-pine-50 text-pine-800 flex items-center justify-center font-bold">
                <FileTextIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Register New Bid Against Tender
                </h2>
                <p className="text-xs text-slate-500">
                  Link a registered bidder to an active tender to begin AI compliance verification.
                </p>
              </div>
            </div>
            <form onSubmit={T} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {'Select Active Tender '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={p}
                  onChange={(P) => h(P.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                  required
                >
                  <option value="">— Choose a Tender —</option>
                  {r.map((P) => (
                    <option key={P.id} value={P.id}>
                      {P.tender_id}
                      {' · '}
                      {P.title}
                      {' ('}
                      {P.status})
                    </option>
                  ))}
                </select>
                {p &&
                  (() => {
                    var $;
                    const P = r.find((D) => String(D.id) === p);
                    return P ? (
                      <div className="mt-2.5 p-3.5 bg-pine-50/70 rounded-xl border border-pine-200 text-xs flex flex-wrap gap-4">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <CalendarIcon className="w-3.5 h-3.5 text-pine-700" />
                          {' Deadline: '}
                          <strong>{new Date(P.deadline).toLocaleDateString()}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <IndianRupeeIcon className="w-3.5 h-3.5 text-pine-700" />
                          {' Value: '}
                          <strong>₹{P.tender_value.toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <CpuIcon className="w-3.5 h-3.5 text-pine-700" />
                          {' Criteria: '}
                          <strong>
                            {(($ = P.requirements) == null ? undefined : $.length) || 0}
                            {' checks'}
                          </strong>
                        </span>
                      </div>
                    ) : null;
                  })()}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {'Select Registered Bidder '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative mb-2.5">
                  <SearchIcon className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bidder by company name, PAN…"
                    value={y}
                    onChange={(P) => x(P.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {I.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400">
                      {'No bidders found. '}
                      <Link to="/bidders" className="text-pine-700 font-bold underline">
                        Register a bidder first →
                      </Link>
                    </div>
                  ) : (
                    I.map((P) => (
                      <label
                        key={P.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${String(m) === String(P.id) ? 'bg-pine-50/80 font-semibold' : ''}`}
                      >
                        <input
                          type="radio"
                          name="bidder"
                          value={P.id}
                          checked={String(m) === String(P.id)}
                          onChange={() => b(String(P.id))}
                          className="accent-pine-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900">{P.company_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {'PAN: '}
                            {P.pan || '–'}
                            {' | GSTIN: '}
                            {P.gstin || '–'} {P.is_msme ? '· MSME ✓' : ''}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-champagne-50/90 border border-champagne-200 rounded-2xl p-3.5">
                <TriangleAlertIcon className="w-4 h-4 text-champagne-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-champagne-950 leading-relaxed">
                  {
                    'After registration, the AI compliance engine will automatically evaluate statutory verification requirements (PAN, GST, Udyam, ITR, Debarment list, OEM, Make in India). Final qualification decision rests strictly with the '
                  }
                  <strong>Procurement Officer</strong>.
                </p>
              </div>
              {_ && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs font-semibold">
                  <CircleCheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {_}
                </div>
              )}
              {O && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs font-semibold">
                  <CircleXIcon className="w-4 h-4 text-rose-600 flex-shrink-0" /> {O}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={j || !p || !m}
                  className="flex-1 py-3 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CpuIcon className={`w-4 h-4 ${j ? 'animate-spin' : ''}`} />
                  {j ? 'Registering & Running AI Check…' : 'Register Bid & Start AI Verification'}
                </button>
                <button
                  type="button"
                  onClick={() => t('all')}
                  className="px-5 py-3 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-soft p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <FileTextIcon className="w-4 h-4 text-pine-700" />
              {' Active Tenders'}
            </h3>
            <div className="space-y-2.5">
              {r
                .filter((P) => P.status === 'ACTIVE')
                .slice(0, 6)
                .map((P) => (
                  <div
                    key={P.id}
                    className="p-3 border border-slate-200 rounded-xl hover:border-pine-400 hover:bg-pine-50/40 transition-all cursor-pointer group"
                    onClick={() => {
                      (h(String(P.id)), t('submit'));
                    }}
                  >
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-pine-800 transition-colors">
                      {P.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px]">
                      <span className="font-mono text-pine-800 font-semibold">{P.tender_id}</span>
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <CalendarIcon className="w-3 h-3" />{' '}
                        {new Date(P.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-500">
                        {P.bids_count || 0}
                        {' bids registered'}
                      </span>
                      <span className="font-bold bg-pine-100 text-pine-800 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              {r.filter((P) => P.status === 'ACTIVE').length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active tenders.
                  <br />
                  <Link to="/tenders" className="text-pine-700 font-bold underline">
                    Create a Tender →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
