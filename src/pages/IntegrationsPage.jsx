import { useEffect, useState } from 'react';
import { CpuIcon, SearchIcon, ServerIcon, ShieldCheckIcon, ZapIcon } from 'lucide-react';
import { api } from '../api';

export const IntegrationsPage = () => {
  var C, I, R, P;
  const [e, t] = useState([]),
    [r, n] = useState(true),
    [i, a] = useState(''),
    [o, l] = useState('27ABCDE1234F1Z5'),
    [c, u] = useState(null),
    [f, d] = useState(false),
    [p, h] = useState('ABCDE1234F'),
    [y, x] = useState(null),
    [g, v] = useState(false),
    [m, b] = useState('Bharat Systems Pvt Ltd'),
    [j, w] = useState(null),
    [_, S] = useState(false);
  useEffect(() => {
    O();
  }, []);
  const O = async () => {
      try {
        n(true);
        const $ = await api.getIntegrationsStatus();
        (t($.connectors), a($.disclaimer));
      } catch ($) {
        console.error($);
      } finally {
        n(false);
      }
    },
    A = async ($) => {
      $.preventDefault();
      try {
        d(true);
        const D = await api.testGST(o);
        u(D);
      } finally {
        d(false);
      }
    },
    E = async ($) => {
      $.preventDefault();
      try {
        v(true);
        const D = await api.testPAN(p);
        x(D);
      } finally {
        v(false);
      }
    },
    T = async ($) => {
      $.preventDefault();
      try {
        S(true);
        const D = await api.testDebarment(m);
        w(D);
      } finally {
        S(false);
      }
    };
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Government Portal Integrations Architecture
            </h1>
            <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 border border-pine-200">
              <ZapIcon className="w-2.5 h-2.5 text-pine-600" />
              14 Connectors Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified statutory gateway architecture for GSTN, MCA21, Udyam, Income Tax e-PAN, EPFO,
            and Central Debarment registers.
          </p>
        </div>
      </div>
      <div className="p-4 bg-champagne-50/90 rounded-2xl border border-champagne-200 text-xs text-champagne-950 flex items-start gap-3">
        <ShieldCheckIcon className="w-5 h-5 text-champagne-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-champagne-950">
            Statutory Transparency Disclaimer (SIH Prototype Mode)
          </h4>
          <p className="mt-0.5 leading-relaxed text-champagne-800">
            {i ||
              'DEMO / SYNTHETIC DATA — All connectors operate in Sandboxed / Mock evaluation mode for SIH prototype. Connectors are built on standard REST adapters that easily map to authorized National Informatics Centre (NIC) and API Setu production endpoints.'}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ServerIcon className="w-3.5 h-3.5 text-pine-700" />
            Statutory Verification Connectors Matrix ({e.length})
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Protocols: REST / JSON / mTLS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {e.map(($) => (
            <div
              key={$.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-card-hover hover:border-pine-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-md bg-pine-50 text-pine-900 border border-pine-200 uppercase">
                    {$.mode}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pine-500 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-pine-800 transition-colors">
                  {$.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{$.type}</p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>
                  {'Latency: '}
                  <strong className="text-slate-700">{$.latency_ms}ms</strong>
                </span>
                <span className="text-pine-700 font-bold bg-pine-50 px-1.5 py-0.2 rounded border border-pine-200">
                  {$.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CpuIcon className="w-4 h-4 text-pine-800" />
              Interactive Verification Gateway Sandbox
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate live API queries against GSTN, Income Tax e-PAN, and National Debarment
              registries.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-pine-50 text-pine-900 font-bold px-2.5 py-1 rounded-lg border border-pine-200">
            Gateway: Active · 100% Deterministic Match
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <SearchIcon className="w-3.5 h-3.5 text-pine-700" />
                  GSTN Verification Gateway
                </h4>
                <span className="text-[9px] bg-pine-100 text-pine-800 font-bold px-1.5 py-0.5 rounded font-mono border border-pine-200">
                  GSTN API v2.1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Enter any 15-character GSTIN or select a quick test preset:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => l('27ABCDE1234F1Z5')}
                  className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:border-pine-400 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ✓ ABC Tech (Active)
                </button>
                <button
                  type="button"
                  onClick={() => l('08BHART9999K1Z8')}
                  className="text-[10px] bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ⚠ Bharat Sys (Suspended)
                </button>
              </div>
              <form onSubmit={A} className="space-y-2">
                <input
                  type="text"
                  value={o}
                  onChange={($) => l($.target.value.toUpperCase())}
                  className="w-full p-2 text-xs border rounded-xl bg-white font-mono uppercase focus:ring-2 focus:ring-pine-600 focus:outline-none"
                  placeholder="27ABCDE1234F1Z5"
                  maxLength={15}
                />
                <button
                  type="submit"
                  disabled={f}
                  className="w-full py-2 bg-pine-900 hover:bg-pine-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 border border-champagne-400/30"
                >
                  {f ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting to GSTN...</span>
                    </>
                  ) : (
                    <span>Query GSTN Portal</span>
                  )}
                </button>
              </form>
            </div>
            {c && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border text-xs space-y-2 ${c.verified && c.status === 'ACTIVE' ? 'bg-pine-50/90 border-pine-200 text-pine-950' : c.status === 'SUSPENDED' ? 'bg-champagne-50/90 border-champagne-200 text-champagne-950' : 'bg-rose-50/90 border-rose-200 text-rose-950'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-[11px]">
                    {((C = c.data) == null ? undefined : C.gstin) || o}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.status === 'ACTIVE' ? 'bg-pine-200 text-pine-900' : 'bg-rose-200 text-rose-900'}`}
                  >
                    {c.status}
                  </span>
                </div>
                {c.data ? (
                  <div className="space-y-1 text-[11px]">
                    <p>
                      <strong className="text-slate-700">Legal Name:</strong>{' '}
                      <span className="font-semibold">{c.data.legal_name}</span>
                    </p>
                    <p>
                      <strong className="text-slate-700">Trade Name:</strong> {c.data.trade_name}
                    </p>
                    <p>
                      <strong className="text-slate-700">State / Region:</strong> {c.data.state}
                    </p>
                    <p>
                      <strong className="text-slate-700">Taxpayer Type:</strong>{' '}
                      {c.data.taxpayer_type}
                    </p>
                    <p>
                      <strong className="text-slate-700">Filing Status:</strong>{' '}
                      <span className="font-medium text-pine-800">{c.data.filing_status}</span>
                    </p>
                    <div className="pt-1.5 border-t border-pine-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>
                        {'PAN: '}
                        {c.data.pan_linked}
                      </span>
                      <span className="text-pine-700 font-bold">✓ E-Invoice Enabled</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] leading-tight">{c.message || 'No record found.'}</p>
                )}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <SearchIcon className="w-3.5 h-3.5 text-pine-700" />
                  ITD e-PAN Verification
                </h4>
                <span className="text-[9px] bg-pine-100 text-pine-800 font-bold px-1.5 py-0.5 rounded font-mono border border-pine-200">
                  ITD NSDL API
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Enter 10-character PAN or select a quick test preset:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => h('ABCDE1234F')}
                  className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:border-pine-400 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ✓ ABCDE1234F (Company)
                </button>
                <button
                  type="button"
                  onClick={() => h('XYZAB5678C')}
                  className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:border-pine-400 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ✓ XYZAB5678C
                </button>
              </div>
              <form onSubmit={E} className="space-y-2">
                <input
                  type="text"
                  value={p}
                  onChange={($) => h($.target.value.toUpperCase())}
                  className="w-full p-2 text-xs border rounded-xl bg-white font-mono uppercase focus:ring-2 focus:ring-pine-600 focus:outline-none"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                <button
                  type="submit"
                  disabled={g}
                  className="w-full py-2 bg-pine-900 hover:bg-pine-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 border border-champagne-400/30"
                >
                  {g ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with ITD...</span>
                    </>
                  ) : (
                    <span>Query PAN Registry</span>
                  )}
                </button>
              </form>
            </div>
            {y && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border text-xs space-y-2 ${y.verified ? 'bg-pine-50/90 border-pine-200 text-pine-950' : 'bg-rose-50/90 border-rose-200 text-rose-950'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-bold text-[11px]">
                    {((I = y.data) == null ? undefined : I.pan) || p}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${y.verified ? 'bg-pine-200 text-pine-900' : 'bg-rose-200 text-rose-900'}`}
                  >
                    {y.status}
                  </span>
                </div>
                {y.data ? (
                  <div className="space-y-1 text-[11px]">
                    <p>
                      <strong className="text-slate-700">Entity Name:</strong>{' '}
                      <span className="font-semibold">{y.data.entity_name}</span>
                    </p>
                    <p>
                      <strong className="text-slate-700">Category:</strong> {y.data.category}
                    </p>
                    <p>
                      <strong className="text-slate-700">Aadhaar Seeding:</strong>{' '}
                      {y.data.aadhaar_seeding}
                    </p>
                    <p>
                      <strong className="text-slate-700">Jurisdiction:</strong>{' '}
                      {y.data.jurisdiction}
                    </p>
                    <div className="pt-1.5 border-t border-pine-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>
                        {'Masked: '}
                        {y.data.masked_pan}
                      </span>
                      <span className="text-pine-700 font-bold">✓ ITD Active Record</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px]">{y.message || 'Invalid PAN format.'}</p>
                )}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <SearchIcon className="w-3.5 h-3.5 text-rose-600" />
                  National Debarment Registry
                </h4>
                <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded font-mono">
                  CPPP / CVC Master
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Screen company against Central Blacklisting database:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => b('Bharat Systems Pvt Ltd')}
                  className="text-[10px] bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ⚠ Bharat Systems (Debarred)
                </button>
                <button
                  type="button"
                  onClick={() => b('ABC Technologies Pvt Ltd')}
                  className="text-[10px] bg-white border border-slate-200 text-slate-700 hover:border-pine-400 px-2 py-0.5 rounded-lg font-mono transition-colors"
                >
                  ✓ ABC Tech (Clear)
                </button>
              </div>
              <form onSubmit={T} className="space-y-2">
                <input
                  type="text"
                  value={m}
                  onChange={($) => b($.target.value)}
                  className="w-full p-2 text-xs border rounded-xl bg-white focus:ring-2 focus:ring-rose-600 focus:outline-none"
                  placeholder="Company Name (e.g. Bharat Systems)"
                />
                <button
                  type="submit"
                  disabled={_}
                  className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {_ ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scanning National Blacklist...</span>
                    </>
                  ) : (
                    <span>Run Debarment Match</span>
                  )}
                </button>
              </form>
            </div>
            {j && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border text-xs space-y-2 ${j.is_debarred ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-pine-50/90 border-pine-200 text-pine-950'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[11px]">{m}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${j.is_debarred ? 'bg-rose-600 text-white animate-pulse' : 'bg-pine-200 text-pine-900'}`}
                  >
                    {j.is_debarred ? 'CRITICAL: DEBARRED' : 'CLEAR / NO RECORD'}
                  </span>
                </div>
                {j.is_debarred &&
                (P = (R = j.matches) == null ? undefined : R[0]) != null &&
                P.record ? (
                  <div className="space-y-1 text-[11px]">
                    <p>
                      <strong className="text-rose-900">Debarring Agency:</strong>{' '}
                      {j.matches[0].record.debarring_agency}
                    </p>
                    <p>
                      <strong className="text-rose-900">Order No:</strong>{' '}
                      {j.matches[0].record.order_number}
                    </p>
                    <p>
                      <strong className="text-rose-900">Period:</strong>{' '}
                      {j.matches[0].record.debarment_period}
                    </p>
                    <p>
                      <strong className="text-rose-900">Reason:</strong>{' '}
                      {j.matches[0].record.reason}
                    </p>
                    <p className="pt-1.5 border-t border-rose-200 text-[10px] text-rose-800 font-semibold">
                      ⚠ Mandatory disqualification under GFR Rule 151.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] leading-tight text-pine-950">
                    {j.message ||
                      'No active debarment or banning orders found across Central Ministries and PSUs.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-pine-700" />
          <h3 className="text-sm font-bold text-slate-900">
            How 100% Guaranteed Statutory Verification Operates
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The GeM Bid Compliance AI platform utilizes a 4-layered deterministic verification
          pipeline to guarantee 100% statutory validation:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-pine-50/60 rounded-2xl border border-pine-100 space-y-1">
            <span className="text-[10px] font-bold font-mono text-pine-800 uppercase block">
              Layer 1
            </span>
            <h4 className="text-xs font-bold text-slate-900">{'Mod-36 Checksum & Syntax'}</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Deterministic validation of 15-digit GSTIN (State Code + PAN + Entity + Z + Checksum)
              and 10-digit PAN syntax.
            </p>
          </div>
          <div className="p-4 bg-pine-50/60 rounded-2xl border border-pine-100 space-y-1">
            <span className="text-[10px] font-bold font-mono text-pine-800 uppercase block">
              Layer 2
            </span>
            <h4 className="text-xs font-bold text-slate-900">Live GSTN / GSP Gateway</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Direct REST calls to GSTN / NIC e-Way Bill servers via authorized GSPs (NSDL, CDAC,
              API Setu) returning live filing status.
            </p>
          </div>
          <div className="p-4 bg-pine-50/60 rounded-2xl border border-pine-100 space-y-1">
            <span className="text-[10px] font-bold font-mono text-pine-800 uppercase block">
              Layer 3
            </span>
            <h4 className="text-xs font-bold text-slate-900">{'MCA21 & ITD Cross-Check'}</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Cross-verifying Legal Entity Name, CIN status, Director Disqualification, and ICAI
              UDIN for CA audited turnover.
            </p>
          </div>
          <div className="p-4 bg-pine-50/60 rounded-2xl border border-pine-100 space-y-1">
            <span className="text-[10px] font-bold font-mono text-pine-800 uppercase block">
              Layer 4
            </span>
            <h4 className="text-xs font-bold text-slate-900">CPPP / CVC Debarment Filter</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Exact PAN + soundex/fuzzy similarity matching against all Central Ministries and PSU
              blacklists to stop debarred vendors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
