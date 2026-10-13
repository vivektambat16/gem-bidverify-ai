import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2Icon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  SlidersVerticalIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { api } from '../api';

const defaultRequirementTemplates = [
  {
    code: 'PAN',
    name: 'Permanent Account Number (PAN) Card',
    mandatory: true,
    source: 'ITD_PAN_REGISTRY',
    min_cond: 'Valid active PAN in bidder name',
    weight: 10,
  },
  {
    code: 'GST',
    name: 'Goods & Services Tax (GST) Registration',
    mandatory: true,
    source: 'GSTN_PORTAL',
    min_cond: 'Active GSTIN with regular filing',
    weight: 15,
  },
  {
    code: 'UDYAM',
    name: 'MSME / Udyam Registration Certificate',
    mandatory: false,
    source: 'UDYAM_PORTAL',
    min_cond: 'Valid Udyam reg for purchase preference',
    weight: 10,
  },
  {
    code: 'ITR',
    name: 'Income Tax Returns & CA Turnover (Last 3 FYs)',
    mandatory: true,
    source: 'ITD_ITR_ICAI_UDIN',
    min_cond: 'Min average turnover ₹1.5 Cr with valid UDIN',
    weight: 15,
  },
  {
    code: 'OEM_AUTH',
    name: 'Manufacturer Authorization Form (MAF / OEM Auth)',
    mandatory: true,
    source: 'OEM_VERIFICATION',
    min_cond: 'Direct authorization letter addressed to tender',
    weight: 15,
  },
  {
    code: 'MAKE_IN_INDIA',
    name: 'Make in India (MII) Local Content Declaration',
    mandatory: true,
    source: 'DPIIT_MII_DECLARATION',
    min_cond: 'Class-I Local Supplier (>=50% local content)',
    weight: 15,
  },
  {
    code: 'EPFO',
    name: 'EPFO Registration & ECR Electronic Challan',
    mandatory: false,
    source: 'EPFO_PORTAL',
    min_cond: 'Active establishment code',
    weight: 5,
  },
  {
    code: 'ESIC',
    name: 'ESIC Registration & Compliance Declaration',
    mandatory: false,
    source: 'ESIC_PORTAL',
    min_cond: 'Active ESIC employer registration',
    weight: 5,
  },
  {
    code: 'DEBARMENT',
    name: 'Non-Blacklisting / Debarment Affidavit',
    mandatory: true,
    source: 'CPPP_GEM_DEBARMENT_LIST',
    min_cond: 'No debarment by any Central/State Govt/PSU',
    weight: 10,
  },
  {
    code: 'BIS',
    name: 'BIS Quality Standard / CRS Certification',
    mandatory: false,
    source: 'BIS_PORTAL',
    min_cond: 'Valid IS/ISO Standard certification',
    weight: 10,
  },
  {
    code: 'STARTUP',
    name: 'DPIIT Startup Recognition Certificate',
    mandatory: false,
    source: 'STARTUP_INDIA_PORTAL',
    min_cond: 'Valid DIPP recognition for EMD exemption',
    weight: 5,
  },
];

const RequirementsEditor = ({ requirements: e, onChange: t }) => {
  const [r, n] = useState(''),
    [i, a] = useState(''),
    [o, l] = useState(true),
    [c, u] = useState(10),
    [f, d] = useState(''),
    p = (g) => {
      const v = e.some((m) => m.requirement_code === g.code);
      t(
        v
          ? e.filter((m) => m.requirement_code !== g.code)
          : [
              ...e,
              {
                requirement_code: g.code,
                requirement_name: g.name,
                is_mandatory: g.mandatory,
                verification_source: g.source,
                min_condition: g.min_cond,
                weight: g.weight,
                applicable_bidder_type: 'ALL',
              },
            ],
      );
    },
    h = (g) => {
      (g.preventDefault(),
        !(!r || !i) &&
          (t([
            ...e,
            {
              requirement_code: r.toUpperCase().replace(/\s+/g, '_'),
              requirement_name: i,
              is_mandatory: o,
              verification_source: 'PORTAL_CROSS_CHECK',
              min_condition: f || undefined,
              weight: c,
              applicable_bidder_type: 'ALL',
            },
          ]),
          n(''),
          a(''),
          d('')));
    },
    y = (g) => {
      t(e.filter((v) => v.requirement_code !== g));
    },
    x = e.reduce((g, v) => g + Number(v.weight), 0);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <SlidersVerticalIcon className="w-3.5 h-3.5 text-pine-700" />
            Standard Statutory Criteria (Click to Toggle)
          </label>
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${x === 100 ? 'bg-pine-100 text-pine-800' : 'bg-champagne-100 text-champagne-800'}`}
          >
            {'Total Scoring Weight: '}
            {x}
            {' pts'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {defaultRequirementTemplates.map((g) => {
            const v = e.some((m) => m.requirement_code === g.code);
            return (
              <button
                key={g.code}
                type="button"
                onClick={() => p(g)}
                className={`p-3 text-left rounded-2xl border text-xs transition-all flex flex-col justify-between ${v ? 'bg-pine-50/90 border-pine-600 text-pine-950 shadow-sm font-semibold ring-1 ring-pine-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[11px] font-bold text-champagne-800">
                    {g.code}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    {g.weight}
                    {' pts'}
                  </span>
                </div>
                <p className="text-[11px] leading-tight line-clamp-2 mt-0.5">{g.name}</p>
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex justify-between text-[9.5px] text-slate-400 font-medium">
                  <span>{g.mandatory ? 'Mandatory' : 'Optional'}</span>
                  <span className={v ? 'text-pine-700 font-bold' : ''}>
                    {v ? '✓ Enabled' : '+ Add'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card-soft">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-800">
            Active Tender Evaluation Criteria ({e.length})
          </span>
        </div>
        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
          {e.length === 0 ? (
            <div className="p-5 text-center text-xs text-slate-500">
              No criteria selected. Choose from presets above or add a custom requirement below.
            </div>
          ) : (
            e.map((g) => (
              <div
                key={g.requirement_code}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 flex-shrink-0">
                    {g.requirement_code}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{g.requirement_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {g.min_condition || 'Standard verification'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.is_mandatory ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {g.is_mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {g.weight}
                    {' pts'}
                  </span>
                  <button
                    type="button"
                    onClick={() => y(g.requirement_code)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                    title="Remove criterion"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Settings2Icon className="w-4 h-4 text-pine-700" />
          Add Custom Tender-Specific Requirement
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            placeholder="Code (e.g. ISO_27001)"
            value={r}
            onChange={(g) => n(g.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Requirement Name"
            value={i}
            onChange={(g) => a(g.target.value)}
            className="p-2.5 border border-slate-300 rounded-xl bg-white sm:col-span-2 focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Weight (pts)"
            value={c}
            onChange={(g) => u(Number(g.target.value))}
            className="p-2.5 border border-slate-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={o}
              onChange={(g) => l(g.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="font-medium">
              Mandatory Requirement (Non-compliance disqualifies bidder)
            </span>
          </label>
          <button
            type="button"
            onClick={h}
            className="px-4 py-2 bg-pine-800 hover:bg-pine-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5 text-champagne-300" />
            <span>Add Criterion</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const TendersPage = () => {
  const [e, t] = useState([]),
    [r, n] = useState(true),
    [i, a] = useState(false),
    [o, l] = useState(''),
    [c, u] = useState('GEM/2026/B/' + Math.floor(1e4 + Math.random() * 9e4)),
    [f, d] = useState(''),
    [p, h] = useState(''),
    [y, x] = useState(5e6),
    [g, v] = useState(new Date(Date.now() + 14 * 864e5).toISOString().split('T')[0]),
    [m, b] = useState(''),
    [j, w] = useState([
      {
        requirement_code: 'PAN',
        requirement_name: 'Permanent Account Number (PAN) Card',
        is_mandatory: true,
        verification_source: 'ITD_PAN_REGISTRY',
        min_condition: 'Valid active PAN in bidder name',
        weight: 10,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'GST',
        requirement_name: 'Goods & Services Tax (GST) Registration',
        is_mandatory: true,
        verification_source: 'GSTN_PORTAL',
        min_condition: 'Active GSTIN with regular filing',
        weight: 15,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'UDYAM',
        requirement_name: 'MSME / Udyam Registration Certificate',
        is_mandatory: false,
        verification_source: 'UDYAM_PORTAL',
        min_condition: 'Valid Udyam reg for purchase preference',
        weight: 10,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'ITR',
        requirement_name: 'Income Tax Returns & CA Turnover (Last 3 FYs)',
        is_mandatory: true,
        verification_source: 'ITD_ITR_ICAI_UDIN',
        min_condition: 'Min average turnover ₹1.5 Cr with valid UDIN',
        weight: 15,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'OEM_AUTH',
        requirement_name: 'Manufacturer Authorization Form (MAF / OEM Auth)',
        is_mandatory: true,
        verification_source: 'OEM_VERIFICATION',
        min_condition: 'Direct authorization letter addressed to tender',
        weight: 15,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'MAKE_IN_INDIA',
        requirement_name: 'Make in India (MII) Local Content Declaration',
        is_mandatory: true,
        verification_source: 'DPIIT_MII_DECLARATION',
        min_condition: 'Class-I Local Supplier (>=50% local content)',
        weight: 15,
        applicable_bidder_type: 'ALL',
      },
      {
        requirement_code: 'DEBARMENT',
        requirement_name: 'Non-Blacklisting / Debarment Affidavit',
        is_mandatory: true,
        verification_source: 'CPPP_GEM_DEBARMENT_LIST',
        min_condition: 'No debarment by any Central/State Govt/PSU',
        weight: 10,
        applicable_bidder_type: 'ALL',
      },
    ]),
    [_, S] = useState(false),
    [O, A] = useState('');
  useEffect(() => {
    E();
  }, []);
  const E = async () => {
      try {
        n(true);
        const I = await api.getTenders();
        t(I);
      } catch (I) {
        console.error(I);
      } finally {
        n(false);
      }
    },
    T = async (I) => {
      if ((I.preventDefault(), !f || !p)) {
        A('Title and Department are required.');
        return;
      }
      try {
        (S(true),
          A(''),
          await api.createTender({
            tender_id: c,
            title: f,
            department: p,
            tender_value: y,
            deadline: new Date(g).toISOString(),
            description: m,
            requirements: j,
          }),
          a(false),
          E());
      } catch (R) {
        A(R.message || 'Failed to create tender');
      } finally {
        S(false);
      }
    },
    C = e.filter(
      (I) =>
        I.title.toLowerCase().includes(o.toLowerCase()) ||
        I.tender_id.toLowerCase().includes(o.toLowerCase()) ||
        I.department.toLowerCase().includes(o.toLowerCase()),
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {'Tenders & Evaluation Criteria'}
            </h1>
            <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
              GFR Rule 149
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statutory eligibility conditions, scoring weights, and mandatory compliance
            rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => a(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center gap-2 group"
          >
            <PlusIcon className="w-4 h-4 text-champagne-300" />
            <span>Publish New Tender</span>
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card-soft">
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tenders by Title, Tender ID (e.g. GEM/2026/B/...), Department..."
            value={o}
            onChange={(I) => l(I.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {r ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
            Loading tenders registry...
          </div>
        ) : C.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-xs bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            No matching tenders found. Click "Publish New Tender" to create one.
          </div>
        ) : (
          C.map((I) => {
            var R, P, $;
            return (
              <div
                key={I.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card-soft hover:shadow-card-hover transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {I.tender_id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-pine-100 text-pine-800 px-2.5 py-0.5 rounded-full">
                      {I.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-pine-800 transition-colors">
                    {I.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building2Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{I.department}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Tender Value:
                      </span>
                      <p className="font-bold font-mono text-slate-900 text-sm">
                        ₹{I.tender_value.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Evaluation Deadline:
                      </span>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 text-champagne-600" />
                        {new Date(I.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Configured Criteria (
                      {((R = I.requirements) == null ? undefined : R.length) || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(P = I.requirements) == null
                        ? undefined
                        : P.slice(0, 5).map((D) => (
                            <span
                              key={D.id || D.requirement_code}
                              className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200"
                            >
                              {D.requirement_code}
                            </span>
                          ))}
                      {((($ = I.requirements) == null ? undefined : $.length) || 0) > 5 && (
                        <span className="text-[10px] font-mono text-pine-800 bg-pine-50 px-2 py-0.5 rounded-md font-bold border border-pine-200">
                          +{I.requirements.length - 5}
                          {' more'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    <strong>{I.bids_count || 0}</strong>
                    {' Submissions'}
                  </span>
                  <Link
                    to={`/bids?tender_id=${I.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine-50 hover:bg-pine-800 text-pine-900 hover:text-white font-bold rounded-xl transition-all border border-pine-200 text-[11px]"
                  >
                    <span>Review Submissions</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
      {i && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-[#060D17] to-[#0D3830] text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pine-800/80 border border-pine-600/50 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-champagne-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {'Publish Tender & Define Criteria Matrix'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Set mandatory eligibility criteria and scoring weights under GFR 2017
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
            <form onSubmit={T} className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {O && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
                  {O}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tender ID (GeM Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={c}
                    onChange={(I) => u(I.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Procuring Department / Ministry
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={'e.g. Department of Electronics & IT'}
                    value={p}
                    onChange={(I) => h(I.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tender Title / Scope of Work
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      'e.g. Supply, Installation & Maintenance of Enterprise Cloud Server Hardware'
                    }
                    value={f}
                    onChange={(I) => d(I.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Estimated Tender Value (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={y}
                    onChange={(I) => x(Number(I.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {'Submission & Evaluation Deadline'}
                  </label>
                  <input
                    type="date"
                    required
                    value={g}
                    onChange={(I) => v(I.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <RequirementsEditor requirements={j} onChange={w} />
              </div>
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => a(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={_}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-pine-800 to-teal-800 hover:from-pine-900 hover:to-teal-900 rounded-xl shadow-glow-teal transition-all"
                >
                  {_ ? 'Publishing Tender...' : 'Publish Tender & Criteria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
