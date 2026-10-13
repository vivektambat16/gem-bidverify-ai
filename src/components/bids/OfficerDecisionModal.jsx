import { useState } from 'react';
import {
  CircleCheckBigIcon,
  CircleHelpIcon,
  CircleXIcon,
  FileCheck2Icon,
  LockIcon,
  SendIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react';

export const OfficerDecisionModal = ({ isOpen: e, onClose: t, bid: r, onSubmit: n }) => {
  const [i, a] = useState('APPROVED'),
    [o, l] = useState(''),
    [c, u] = useState(''),
    [f, d] = useState(false),
    [p, h] = useState(false),
    [y, x] = useState('');
  if (!e) return null;
  const g = async (v) => {
    if ((v.preventDefault(), !o.trim())) {
      x('Procurement Officer justification remarks are mandatory under GFR & CVC guidelines.');
      return;
    }
    if (!f) {
      x('Please check the statutory confirmation box to sign off on this decision.');
      return;
    }
    try {
      (h(true),
        x(''),
        await n({
          decision: i,
          comments: o,
          clarification_details: i === 'REQUEST_CLARIFICATION' ? c : undefined,
        }),
        t());
    } catch (m) {
      x(m.message || 'Failed to submit officer decision');
    } finally {
      h(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-gradient-to-r from-obsidian-950 via-pine-900 to-pine-800 text-white flex justify-between items-center border-b border-pine-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pine-800/80 border border-pine-500/40 flex items-center justify-center shadow">
              <FileCheck2Icon className="w-5 h-5 text-champagne-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Final Procurement Officer Decision Sign-off</h2>
              <p className="text-xs text-pine-200">
                {'Bid: '}
                <strong className="text-white font-mono">{r.bid_id}</strong>
                {' • '}
                {r.bidder.company_name}
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
        <form onSubmit={g} className="p-6 space-y-5">
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5 text-pine-700" />
                AI Recommendation Summary
              </span>
              <span className="font-mono font-bold bg-pine-100 text-pine-900 px-2.5 py-0.5 rounded-full border border-pine-200">
                {'Score: '}
                {r.compliance_score}/100 ({r.risk_level}
                {' Risk)'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed mt-1">{r.ai_explanation}</p>
          </div>
          {y && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <TriangleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{y}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Official Evaluation Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${i === 'APPROVED' ? 'bg-pine-50/90 border-pine-500 shadow-sm ring-1 ring-pine-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="APPROVED"
                  checked={i === 'APPROVED'}
                  onChange={() => a('APPROVED')}
                  className="hidden"
                />
                <CircleCheckBigIcon className="w-5 h-5 text-pine-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Approve / Qualify</p>
                  <p className="text-[10px] text-slate-500">Proceed to financial cover opening</p>
                </div>
              </label>
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${i === 'REJECTED' ? 'bg-rose-50/90 border-rose-500 shadow-sm ring-1 ring-rose-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="REJECTED"
                  checked={i === 'REJECTED'}
                  onChange={() => a('REJECTED')}
                  className="hidden"
                />
                <CircleXIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Reject / Disqualify</p>
                  <p className="text-[10px] text-slate-500">
                    Non-compliant with mandatory criteria
                  </p>
                </div>
              </label>
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${i === 'REQUEST_CLARIFICATION' ? 'bg-champagne-50/90 border-champagne-500 shadow-sm ring-1 ring-champagne-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="REQUEST_CLARIFICATION"
                  checked={i === 'REQUEST_CLARIFICATION'}
                  onChange={() => a('REQUEST_CLARIFICATION')}
                  className="hidden"
                />
                <CircleHelpIcon className="w-5 h-5 text-champagne-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Request Clarification</p>
                  <p className="text-[10px] text-slate-500">Issue official query to bidder</p>
                </div>
              </label>
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${i === 'SEND_FOR_MANUAL_REVIEW' ? 'bg-slate-100 border-slate-400 shadow-sm ring-1 ring-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="SEND_FOR_MANUAL_REVIEW"
                  checked={i === 'SEND_FOR_MANUAL_REVIEW'}
                  onChange={() => a('SEND_FOR_MANUAL_REVIEW')}
                  className="hidden"
                />
                <LockIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Committee Review</p>
                  <p className="text-[10px] text-slate-500">Refer to Higher TEC Panel</p>
                </div>
              </label>
            </div>
          </div>
          {i === 'REQUEST_CLARIFICATION' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Clarification Notice for Bidder
              </label>
              <textarea
                rows={2}
                value={c}
                onChange={(v) => u(v.target.value)}
                placeholder="e.g. Please clarify discrepancy between OEM authorization entity name and bidder company name within 48 hours."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-champagne-500 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {'Procurement Officer Justification Remarks '}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={o}
              onChange={(v) => l(v.target.value)}
              placeholder="Record explicit reasons for qualification/disqualification as required under CVC and GFR 2017 guidelines..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-pine-600 focus:outline-none"
            />
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="confirm"
              checked={f}
              onChange={(v) => d(v.target.checked)}
              className="mt-0.5 rounded text-pine-600 focus:ring-pine-500"
            />
            <label
              htmlFor="confirm"
              className="text-[11px] text-slate-600 cursor-pointer leading-relaxed select-none"
            >
              I hereby certify as the Competent Procurement Officer that this decision is made after
              due examination of the evidence and compliance rules under GFR 2017. This action will
              be cryptographically recorded in the CVC Audit Trail.
            </label>
          </div>
          <div className="flex justify-end items-center gap-3 pt-2">
            <button
              type="button"
              onClick={t}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={p}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-pine-900 via-pine-800 to-pine-700 hover:from-pine-800 hover:to-pine-600 rounded-xl shadow-glow-teal transition-all flex items-center gap-2 border border-champagne-400/40"
            >
              {p ? (
                'Submitting...'
              ) : (
                <>
                  <SendIcon className="w-4 h-4 text-champagne-300" />
                  <span>{'Sign & Submit Decision'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
