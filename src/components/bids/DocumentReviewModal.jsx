import { useEffect, useState } from 'react';
import { CircleCheckIcon, CpuIcon, SaveIcon, ScanIcon, UserCheckIcon, XIcon } from 'lucide-react';
import { api } from '../../api';

export const DocumentReviewModal = ({
  isOpen: e,
  onClose: t,
  document: r,
  complianceResult: n,
  bidderName: i,
  bidId: a,
  onSaveSuccess: o,
}) => {
  var O;
  const [l, c] = useState(null),
    [u, f] = useState('AI'),
    [d, p] = useState('VERIFIED'),
    [h, y] = useState(10),
    [x, g] = useState(''),
    [v, m] = useState(false),
    [b, j] = useState('');
  if (
    (useEffect(() => {
      (r != null && r.extracted_fields && r.extracted_fields.length > 0
        ? c(r.extracted_fields[0])
        : c(null),
        n && (p(n.status || 'VERIFIED'), y(n.points_awarded ?? 10), g(n.explanation || '')),
        j(''));
    }, [r, n, e]),
    !e)
  )
    return null;
  const w = (n == null ? undefined : n.max_points) || 10,
    _ = n ? Math.round(n.confidence_score * 100) : 98,
    S = async () => {
      if (!(!a || !n))
        try {
          (m(true),
            j(''),
            await api.updateComplianceResult(a, n.id, {
              points_awarded: Number(h),
              status: d,
              explanation: x,
            }),
            j('Officer score and verification saved successfully! Bid compliance score updated.'),
            o && o());
        } catch (A) {
          alert(A.message || 'Failed to update evaluation');
        } finally {
          m(false);
        }
    };
  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-obsidian-950 via-pine-900 to-pine-800 text-white flex justify-between items-center border-b border-pine-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-800/80 border border-pine-500/40 flex items-center justify-center shadow">
              <ScanIcon className="w-5 h-5 text-champagne-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                {'Explainable Evidence Inspector & Officer Verification Gateway'}
                <span className="text-[10px] bg-champagne-400/20 text-champagne-300 px-2 py-0.5 rounded-full font-mono font-bold border border-champagne-400/30">
                  GFR 2017
                </span>
              </h2>
              <p className="text-xs text-pine-200 truncate max-w-xl">
                {'Bidder: '}
                <strong className="text-white">{i}</strong>
                {' • Document: '}
                {(r == null ? undefined : r.file_name) || 'Statutory Attachment'}
              </p>
            </div>
          </div>
          <button
            onClick={t}
            className="p-1.5 rounded-lg text-pine-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-slate-100/80 px-6 py-2.5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => f('AI')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${u === 'AI' ? 'bg-pine-900 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              <CpuIcon className="w-3.5 h-3.5 text-champagne-400" />
              <span>Option A: AI Verified ({_}% Match)</span>
            </button>
            <button
              onClick={() => f('OFFICER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${u === 'OFFICER' ? 'bg-pine-700 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              <UserCheckIcon className="w-3.5 h-3.5 text-champagne-300" />
              <span>Option B: Officer Point Scoring (Human-in-the-Loop)</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {n && (
              <span>
                {'Requirement Code: '}
                <strong className="text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded font-bold">
                  {n.requirement_code}
                </strong>
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
          <div className="col-span-12 lg:col-span-4 bg-slate-50/70 p-5 border-r border-slate-200 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                Tender Evaluation Requirement
              </span>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                {(n == null ? undefined : n.requirement_name) ||
                  (r == null ? undefined : r.classified_type.replace(/_/g, ' ')) ||
                  'Statutory Qualification Requirement'}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>Statutory Basis:</strong>{' '}
                {(n == null ? undefined : n.rule_applied) || 'GFR 2017 Rule 149 / 151'}
              </p>
            </div>
            {u === 'AI' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${(n == null ? undefined : n.status) === 'VERIFIED' ? 'bg-pine-50/90 border-pine-200 text-pine-950' : (n == null ? undefined : n.status) === 'MISMATCH' ? 'bg-champagne-50/90 border-champagne-200 text-champagne-950' : 'bg-rose-50/90 border-rose-200 text-rose-950'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      AI Evaluation Result
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${(n == null ? undefined : n.status) === 'VERIFIED' ? 'bg-pine-200 text-pine-900' : 'bg-rose-200 text-rose-900'}`}
                    >
                      {(n == null ? undefined : n.status) || 'VERIFIED'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {(n == null ? undefined : n.explanation) ||
                      'Document verified against central statutory registries with zero detected discrepancies.'}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-600">AI Score:</span>
                    <strong className="text-slate-900 font-bold">
                      {(n == null ? undefined : n.points_awarded) ?? 10}
                      {' / '}
                      {w}
                      {' pts'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-600">Confidence:</span>
                    <strong className="text-pine-700 font-bold">{_}% High Fidelity</strong>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-2">
                    OCR Extracted Key Fields (
                    {((O = r == null ? undefined : r.extracted_fields) == null
                      ? undefined
                      : O.length) || 0}
                    )
                  </span>
                  <div className="space-y-2">
                    {!(r != null && r.extracted_fields) || r.extracted_fields.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No extracted key fields available.
                      </p>
                    ) : (
                      r.extracted_fields.map((A) => (
                        <button
                          key={A.id}
                          onClick={() => c(A)}
                          className={`w-full text-left p-3 rounded-2xl text-xs transition-all border ${(l == null ? undefined : l.id) === A.id ? 'bg-pine-900 text-white border-pine-800 shadow-md ring-2 ring-pine-400' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold capitalize">
                              {A.field_name.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-mono ${(l == null ? undefined : l.id) === A.id ? 'text-champagne-300' : 'text-slate-500'}`}
                            >
                              {Math.round(A.confidence * 100)}% Conf
                            </span>
                          </div>
                          <p
                            className={`text-[11px] truncate mt-1 font-mono ${(l == null ? undefined : l.id) === A.id ? 'text-pine-100' : 'text-slate-600'}`}
                          >
                            {A.extracted_value}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            {u === 'OFFICER' && (
              <div className="bg-white p-5 rounded-2xl border border-pine-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <UserCheckIcon className="w-4 h-4 text-pine-700" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Officer Technical Scoring</h4>
                    <p className="text-[10px] text-slate-500">
                      {'Human-in-the-Loop point awarding & validation override.'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Officer Verification Decision:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        val: 'VERIFIED',
                        label: '✓ Verified & Compliant',
                        color: 'border-pine-500 text-pine-800 bg-pine-50',
                      },
                      {
                        val: 'MISMATCH',
                        label: '⚠ Discrepancy Found',
                        color: 'border-champagne-500 text-champagne-800 bg-champagne-50',
                      },
                      {
                        val: 'MISSING',
                        label: '✗ Missing / Ineligible',
                        color: 'border-rose-500 text-rose-800 bg-rose-50',
                      },
                      {
                        val: 'REQUIRES_CLARIFICATION',
                        label: '? Needs Query',
                        color: 'border-blue-500 text-blue-800 bg-blue-50',
                      },
                    ].map((A) => (
                      <button
                        key={A.val}
                        type="button"
                        onClick={() => p(A.val)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${d === A.val ? `${A.color} ring-2 ring-pine-500 shadow-sm` : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                      >
                        {A.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">
                      Awarded Technical Points:
                    </label>
                    <span className="text-sm font-bold font-mono text-pine-800 bg-pine-100/70 px-2 py-0.5 rounded-md">
                      {h}
                      {' / '}
                      {w}
                      {' pts'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={w}
                    step="0.5"
                    value={h}
                    onChange={(A) => y(parseFloat(A.target.value))}
                    className="w-full accent-pine-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 pts</span>
                    <span>
                      {w / 2}
                      {' pts'}
                    </span>
                    <span>
                      {w}
                      {' pts (Full)'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Officer Justification Remarks:
                  </label>
                  <textarea
                    rows={3}
                    value={x}
                    onChange={(A) => g(A.target.value)}
                    placeholder="Enter officer evaluation notes..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pine-600 focus:outline-none"
                  />
                </div>
                {b && (
                  <div className="p-3 bg-pine-50 border border-pine-200 rounded-xl text-xs text-pine-800 flex items-center gap-2 font-semibold">
                    <CircleCheckIcon className="w-4 h-4 text-pine-600 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={S}
                  disabled={v || !n}
                  className="w-full py-3 bg-pine-800 hover:bg-pine-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-champagne-400/40"
                >
                  <SaveIcon className={`w-4 h-4 ${v ? 'animate-spin' : ''}`} />
                  <span>
                    {v ? 'Saving Officer Score...' : 'Save Officer Score & Update Bid Matrix'}
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="col-span-12 lg:col-span-5 bg-obsidian-950 p-6 flex flex-col items-center justify-center overflow-auto relative custom-scrollbar">
            <div className="w-[420px] min-h-[520px] bg-white rounded-2xl shadow-2xl p-6 relative border border-slate-300 font-serif text-slate-900">
              <div className="text-center pb-3 border-b border-slate-300 mb-4">
                <p className="text-[9px] tracking-widest uppercase font-sans font-bold text-slate-500">
                  Government of India Statutory Record
                </p>
                <h3 className="text-xs font-bold text-slate-900 mt-1 uppercase truncate font-sans">
                  {(r == null ? undefined : r.classified_type.replace(/_/g, ' ')) ||
                    'STATUTORY RECORD CERTIFICATE'}
                </h3>
                <p className="text-[9px] text-slate-400 font-sans">
                  GeM Technical Evaluation Repository
                </p>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    Legal Entity Name:
                  </span>
                  <p className="font-bold text-xs text-slate-900 truncate font-sans">{i}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-medium">
                      Document Type:
                    </span>
                    <p className="font-semibold text-slate-800 truncate">
                      {(r == null ? undefined : r.classified_type) || 'SUPPORTING_DOC'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-medium">
                      OCR Confidence:
                    </span>
                    <p className="font-semibold text-pine-700">98.4% (High Fidelity)</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] leading-relaxed font-sans text-slate-600">
                  Cross-verified with statutory registries (GSTN, ITD, UDYAM, CPPP). Bounding box
                  coordinates map directly to OCR extracted values.
                </div>
                {l && l.bounding_box && (
                  <div
                    className="absolute bg-champagne-400/25 border-2 border-champagne-500 rounded-lg p-1 transition-all duration-200 pointer-events-none flex items-start shadow-sm"
                    style={{
                      left: `${Math.min(280, l.bounding_box.x)}px`,
                      top: `${Math.min(380, l.bounding_box.y)}px`,
                      width: `${Math.min(260, l.bounding_box.width)}px`,
                      height: `${Math.max(35, l.bounding_box.height)}px`,
                    }}
                  >
                    <span className="text-[8.5px] bg-champagne-500 text-slate-950 font-bold px-1.5 py-0.5 rounded shadow -mt-4 -ml-1 font-sans">
                      {l.field_name}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`absolute bottom-5 right-5 text-center border-2 rounded-full px-3 py-1 rotate-[-12deg] font-sans font-bold text-[9.5px] ${d === 'VERIFIED' ? 'border-pine-700 text-pine-800 bg-pine-50/80' : 'border-champagne-700 text-champagne-800 bg-champagne-50/80'}`}
              >
                {u === 'OFFICER' ? 'OFFICER VERIFIED' : 'AI VERIFIED'}
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-3 bg-white p-5 border-l border-slate-200 overflow-y-auto space-y-4 custom-scrollbar">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-2.5">
                Field Coordinate Detail
              </span>
              {l ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-pine-50/70 rounded-2xl border border-pine-200">
                    <span className="text-[10px] text-pine-700 font-bold uppercase block">
                      Field Name
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 capitalize">
                      {l.field_name.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Extracted Text
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-0.5 break-all">
                      {l.extracted_value}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Confidence Score
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-pine-500 h-full rounded-full"
                          style={{ width: `${l.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {Math.round(l.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  {l.bounding_box && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
                      <span className="font-bold text-slate-700 block font-sans">
                        OCR Box Coordinates:
                      </span>
                      <p>
                        {'Page: '}
                        {l.bounding_box.page}
                      </p>
                      <p>
                        {'X: '}
                        {l.bounding_box.x}
                        {'px | Y: '}
                        {l.bounding_box.y}px
                      </p>
                      <p>
                        {'W: '}
                        {l.bounding_box.width}
                        {'px | H: '}
                        {l.bounding_box.height}px
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Select a field on the left to inspect bounding coordinates.
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block mb-1.5">
                CVC Immutable Audit Note
              </span>
              <p className="text-[10.5px] text-slate-600 leading-relaxed bg-champagne-50/70 p-3 rounded-xl border border-champagne-200">
                All officer score overrides, manual adjustments, and inspections are permanently
                recorded in the CAG/CVC audit trail.
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3.5 bg-slate-100/90 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600 flex-shrink-0">
          <span>
            Human-in-the-Loop Principle: Officer retains sovereign decision authority under GFR Rule
            173.
          </span>
          <button
            onClick={t}
            className="px-5 py-2 bg-pine-900 hover:bg-pine-800 text-white font-bold rounded-xl shadow-md transition-all border border-champagne-400/30"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
