import { useEffect, useState } from 'react';
import {
  Building2Icon,
  CircleCheckBigIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { api } from '../api';

export const BiddersPage = () => {
  const [e, t] = useState([]),
    [r, n] = useState(true),
    [i, a] = useState(false),
    [o, l] = useState(''),
    [c, u] = useState(''),
    [f, d] = useState(''),
    [p, h] = useState(''),
    [y, x] = useState(''),
    [g, v] = useState(''),
    [m, b] = useState(''),
    [j, w] = useState(''),
    [_, S] = useState(false),
    [O, A] = useState(''),
    [E, T] = useState(false),
    [C, I] = useState(''),
    [R, P] = useState(false),
    [$, D] = useState('');
  useEffect(() => {
    M();
  }, []);
  const M = async () => {
      try {
        n(true);
        const F = await api.getBidders();
        t(F);
      } catch (F) {
        console.error(F);
      } finally {
        n(false);
      }
    },
    L = async (F) => {
      if ((F.preventDefault(), !c || !p)) {
        D('Company Name and PAN are mandatory for bidder registration.');
        return;
      }
      try {
        (P(true),
          D(''),
          await api.createBidder({
            company_name: c,
            cin: f,
            pan: p,
            gstin: y,
            registered_address: g,
            contact_email: m,
            contact_phone: j,
            is_msme: _,
            msme_reg_no: _ ? O : undefined,
            is_startup: E,
            startup_dipp_no: E ? C : undefined,
          }),
          a(false),
          M(),
          u(''),
          d(''),
          h(''),
          x(''),
          v(''),
          b(''),
          w(''));
      } catch (V) {
        D(V.message || 'Failed to register bidder');
      } finally {
        P(false);
      }
    },
    U = e.filter(
      (F) =>
        F.company_name.toLowerCase().includes(o.toLowerCase()) ||
        (F.pan && F.pan.toLowerCase().includes(o.toLowerCase())) ||
        (F.gstin && F.gstin.toLowerCase().includes(o.toLowerCase())),
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {'Bidder & Vendor Master Registry'}
            </h1>
            <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              Verified Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Corporate entity profiles, statutory PAN/GSTIN credentials, and MSME/Startup purchase
            preference classifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => a(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center gap-2 group"
          >
            <PlusIcon className="w-4 h-4 text-champagne-300" />
            <span>Register New Bidder</span>
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Company Name, PAN (e.g. ABCDE1234F), GSTIN, CIN..."
            value={o}
            onChange={(F) => l(F.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {r ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-500">
            Loading bidder master records...
          </div>
        ) : U.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            No bidders found matching your search. Click "Register New Bidder" to add an entity.
          </div>
        ) : (
          U.map((F) => (
            <div
              key={F.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card-soft hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pine-50 to-teal-50 text-pine-800 flex items-center justify-center font-bold text-sm border border-pine-200 shadow-sm group-hover:border-pine-400 transition-colors">
                    {F.company_name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {F.is_msme && (
                      <span className="text-[10px] bg-pine-100 text-pine-800 px-2.5 py-0.5 rounded-full font-bold">
                        MSME / Udyam
                      </span>
                    )}
                    {F.is_startup && (
                      <span className="text-[10px] bg-champagne-100 text-champagne-800 px-2.5 py-0.5 rounded-full font-bold">
                        Startup India
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-pine-800 transition-colors">
                  {F.company_name}
                </h3>
                {F.cin && (
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {'CIN: '}
                    {F.cin}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg">
                    <span className="text-[10.5px] text-slate-500 font-medium">PAN</span>
                    <strong className="font-mono text-slate-900 font-bold">{F.pan || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg">
                    <span className="text-[10.5px] text-slate-500 font-medium">GSTIN</span>
                    <strong className="font-mono text-slate-900 font-bold">
                      {F.gstin || 'N/A'}
                    </strong>
                  </div>
                  {F.msme_reg_no && (
                    <div className="flex justify-between items-center bg-pine-50/70 px-2.5 py-1.5 rounded-lg border border-pine-100">
                      <span className="text-[10.5px] text-pine-800 font-medium">Udyam No</span>
                      <strong className="font-mono text-pine-900 font-bold">{F.msme_reg_no}</strong>
                    </div>
                  )}
                </div>
                {F.registered_address && (
                  <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{F.registered_address}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[10.5px] truncate max-w-[170px] text-slate-400 font-mono">
                  {F.contact_email || 'No email registered'}
                </span>
                <span className="text-pine-800 font-bold flex items-center gap-1 text-[11px] bg-pine-50 px-2 py-0.5 rounded-full border border-pine-200">
                  <CircleCheckBigIcon className="w-3 h-3 text-pine-600" />
                  Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {i && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-[#060D17] to-[#0D3830] text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pine-800/80 border border-pine-600/50 flex items-center justify-center">
                  <Building2Icon className="w-5 h-5 text-champagne-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Register Bidder Entity in GeM Master</h2>
                  <p className="text-xs text-slate-300">
                    Record statutory identification and company parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => a(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={L} className="p-6 space-y-4 text-xs">
              {$ && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
                  {$}
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Company / Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Technologies Pvt Ltd"
                  value={c}
                  onChange={(F) => u(F.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Card Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABCDE1234F"
                    value={p}
                    onChange={(F) => h(F.target.value.toUpperCase())}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={y}
                    onChange={(F) => x(F.target.value.toUpperCase())}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Corporate Identification (CIN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. U72900MH2018PTC308912"
                    value={f}
                    onChange={(F) => d(F.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="bids@company.in"
                    value={m}
                    onChange={(F) => b(F.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Registered Corporate Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Official registered address as per MCA/GSTN records..."
                  value={g}
                  onChange={(F) => v(F.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="msmeCheck"
                    checked={_}
                    onChange={(F) => S(F.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="msmeCheck"
                    className="font-bold text-slate-800 cursor-pointer select-none"
                  >
                    Enterprise is MSME / Udyam Certified (Purchase Preference Enabled)
                  </label>
                </div>
                {_ && (
                  <input
                    type="text"
                    placeholder="Udyam Registration Number (e.g. UDYAM-MH-01-0012345)"
                    value={O}
                    onChange={(F) => A(F.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                )}
              </div>
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => a(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={R}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 rounded-xl shadow-glow-teal transition-all"
                >
                  {R ? 'Registering...' : 'Register Bidder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
