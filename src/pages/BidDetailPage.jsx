import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  Building2Icon,
  CircleCheckBigIcon,
  CircleXIcon,
  CpuIcon,
  EyeIcon,
  FileCheck2Icon,
  FileTextIcon,
  FilesIcon,
  RefreshCwIcon,
  ScanIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserCheckIcon,
} from 'lucide-react';
import { api } from '../api';
import { DocumentUploader } from '../components/bids/DocumentUploader';
import { DocumentReviewModal } from '../components/bids/DocumentReviewModal';
import { OfficerDecisionModal } from '../components/bids/OfficerDecisionModal';

export const BidDetailPage = () => {
  var j, w, _, S, O, A;
  const { id: e } = useParams(),
    [t, r] = useState(null),
    [n, i] = useState(true),
    [a, o] = useState(false),
    [l, c] = useState(null),
    [u, f] = useState(null),
    [d, p] = useState(false),
    [h, y] = useState(false);
  useEffect(() => {
    e && x(e);
  }, [e]);
  const x = async (E) => {
      try {
        i(true);
        const T = await api.getBid(E);
        r(T);
      } catch (T) {
        console.error(T);
      } finally {
        i(false);
      }
    },
    g = async () => {
      if (t)
        try {
          o(true);
          const E = await api.verifyBid(t.id);
          r(E);
        } catch (E) {
          alert(E.message || 'Verification execution failed');
        } finally {
          o(false);
        }
    },
    v = (E) => {
      var C, I;
      const T =
        ((C = t == null ? undefined : t.documents) == null
          ? undefined
          : C.find(
              (R) =>
                R.file_name === E.evidence_document ||
                R.classified_type.toLowerCase().includes(E.requirement_code.toLowerCase()),
            )) ||
        ((I = t == null ? undefined : t.documents) == null ? undefined : I[0]) ||
        null;
      (f(E), c(T), p(true));
    },
    m = async (E) => {
      t && (await api.submitOfficerDecision(t.id, E), await x(t.id));
    },
    b = async (E, T) => {
      if (t && window.confirm(`Are you sure you want to delete '${T}' from this bid repository?`))
        try {
          (await api.deleteDocument(t.id, E), await x(t.id));
        } catch (C) {
          alert(C.message || 'Failed to delete document');
        }
    };
  return n || !t ? (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-pine-900 border-t-pine-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-700">Loading Bid Compliance Matrix...</p>
      </div>
    </div>
  ) : (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/bids"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-pine-800 hover:border-pine-300 shadow-sm transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4 text-pine-600" />
          <span>Back to All Bids</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={g}
            disabled={a}
            className="px-4 py-2.5 bg-obsidian-900 hover:bg-obsidian-850 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 border border-slate-700"
          >
            <RefreshCwIcon
              className={`w-3.5 h-3.5 text-champagne-400 ${a ? 'animate-spin' : ''}`}
            />
            <span>{a ? 'Running AI Engine...' : 'Re-Run Compliance Check'}</span>
          </button>
          <button
            onClick={() => y(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-pine-900 via-pine-800 to-pine-700 hover:from-pine-800 hover:to-pine-600 text-white text-xs font-bold rounded-xl shadow-glow-teal transition-all flex items-center gap-2 border border-champagne-400/40"
          >
            <FileCheck2Icon className="w-4 h-4 text-champagne-300" />
            <span>Make Officer Decision</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-pine-900 bg-pine-50 px-2.5 py-0.5 rounded-lg border border-pine-200">
                {t.bid_id}
              </span>
              <span className="text-[10.5px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {'Tender: '}
                {((j = t.tender) == null ? undefined : j.tender_id) || 'GEM/2026/B/12345'}
              </span>
              <span className="text-[10.5px] font-bold bg-champagne-100 text-champagne-800 px-2 py-0.5 rounded-full font-mono border border-champagne-200">
                GFR 149
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Building2Icon className="w-6 h-6 text-pine-800" />
                {t.bidder.company_name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {'PAN: '}
                <strong className="font-mono text-slate-800">{t.bidder.pan || 'N/A'}</strong>
                {' • GSTIN: '}
                <strong className="font-mono text-slate-800">{t.bidder.gstin || 'N/A'}</strong>
                {' • MSME: '}
                <strong className="text-pine-700 font-semibold">
                  {t.bidder.is_msme ? 'Yes (Udyam Verified)' : 'No'}
                </strong>
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl border ${t.risk_level === 'LOW' ? 'bg-pine-50/90 border-pine-200 text-pine-950' : t.risk_level === 'MEDIUM' ? 'bg-champagne-50/90 border-champagne-200 text-champagne-900' : 'bg-rose-50/90 border-rose-200 text-rose-950'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CpuIcon
                  className={`w-4 h-4 ${t.risk_level === 'LOW' ? 'text-pine-600' : t.risk_level === 'MEDIUM' ? 'text-champagne-600' : 'text-rose-600'}`}
                />
                <span className="font-extrabold text-xs uppercase tracking-wider">
                  {'AI Decision-Support Recommendation: '}
                  {t.ai_recommendation}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {t.ai_explanation ||
                  'Automated multi-source evaluation completed according to deterministic statutory rules.'}
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Compliance Score
              </span>
              <p className="text-3xl font-black font-mono text-slate-900 my-1">
                {t.compliance_score}
                <span className="text-base text-slate-400 font-normal">/100</span>
              </p>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.compliance_score >= 80 ? 'bg-pine-500' : t.compliance_score >= 60 ? 'bg-champagne-500' : 'bg-rose-500'}`}
                  style={{ width: `${t.compliance_score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">
                Deterministic Rule Weights
              </span>
            </div>
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {'Fraud & Risk Index'}
              </span>
              <p
                className={`text-2xl font-black font-mono uppercase tracking-wider my-1 ${t.risk_level === 'LOW' ? 'text-pine-700' : t.risk_level === 'MEDIUM' ? 'text-champagne-700' : 'text-rose-700'}`}
              >
                {t.risk_level}
              </p>
              <span
                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${t.risk_level === 'LOW' ? 'bg-pine-100 text-pine-800' : t.risk_level === 'MEDIUM' ? 'bg-champagne-100 text-champagne-800' : 'bg-rose-100 text-rose-800'}`}
              >
                {((_ = (w = t.risk_assessment) == null ? undefined : w.risk_factors) == null
                  ? undefined
                  : _.length) || 0}
                {' Risk Factors Flagged'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">
                Cross-Registry Verification
              </span>
            </div>
          </div>
        </div>
      </div>
      {t.officer_decision && (
        <div className="bg-gradient-to-r from-pine-50 via-slate-50 to-champagne-50/40 border border-pine-200 p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pine-800 text-white flex items-center justify-center shadow-sm">
                <UserCheckIcon className="w-4 h-4 text-champagne-300" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pine-950">
                Official Signed Officer Decision Record
              </h3>
            </div>
            <span className="text-[10.5px] font-mono text-slate-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-pine-200">
              {'Logged: '}
              {new Date(t.officer_decision.decided_at).toLocaleString()}
            </span>
          </div>
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-pine-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-medium block uppercase">
                Decision Action:
              </span>
              <span className="font-extrabold text-sm text-slate-900">
                {t.officer_decision.decision}
              </span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-pine-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-medium block uppercase">
                Procurement Officer:
              </span>
              <span className="font-bold text-slate-800">{t.officer_decision.officer_name}</span>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-pine-100 shadow-sm">
              <span className="text-[10px] text-slate-400 font-medium block uppercase">
                Officer Rationale:
              </span>
              <p className="text-slate-700 leading-snug font-medium">
                {t.officer_decision.comments}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-pine-700" />
              {'Technical Compliance & Requirement Evidence Matrix'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic rule evaluation, cross-registry status, and bounding-box evidence for
              each tender criterion.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Requirement Code</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                  Tender Criteria Name
                </th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                  Submitted Evidence
                </th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">
                  Evaluation Status
                </th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Score</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">AI Conf.</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {((S = t.compliance_results) == null ? undefined : S.length) === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No compliance evaluation executed yet. Click "Re-Run Compliance Check".
                  </td>
                </tr>
              ) : (O = t.compliance_results) == null ? undefined : (
                O.map((E) => (
                  <tr key={E.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold bg-pine-50 text-pine-900 px-2.5 py-0.5 rounded-lg border border-pine-200">
                        {E.requirement_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{E.requirement_name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {E.explanation}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      {E.evidence_document ? (
                        <span className="flex items-center gap-1 text-pine-700 font-semibold">
                          <FileTextIcon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[140px]">{E.evidence_document}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No Attachment</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${E.status === 'VERIFIED' ? 'bg-pine-100 text-pine-800 border border-pine-200' : E.status === 'MISMATCH' ? 'bg-champagne-100 text-champagne-800 border border-champagne-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}
                      >
                        {E.status === 'VERIFIED' && (
                          <CircleCheckBigIcon className="w-3 h-3 text-pine-600" />
                        )}
                        {E.status === 'MISMATCH' && (
                          <TriangleAlertIcon className="w-3 h-3 text-champagne-600" />
                        )}
                        {E.status === 'MISSING' && (
                          <CircleXIcon className="w-3 h-3 text-rose-600" />
                        )}
                        {E.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {E.points_awarded}
                      {' / '}
                      {E.max_points}
                      {' pts'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {Math.round(E.confidence_score * 100)}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => v(E)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pine-900 text-white hover:bg-pine-800 rounded-xl font-bold text-[11px] shadow-sm transition-all"
                      >
                        <ScanIcon className="w-3.5 h-3.5 text-champagne-300" />
                        <span>View Evidence</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FilesIcon className="w-4 h-4 text-pine-800" />
              {'Attached Bid Documents Repository & OCR Extractions'}
              <span className="bg-pine-100 text-pine-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border border-pine-200">
                {((A = t.documents) == null ? undefined : A.length) || 0}
                {' Files Attached'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live repository of uploaded certificates, OCR extraction status, and layout coordinate
              mappings.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Document Name</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">AI Classification</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">{'Size & Format'}</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">OCR Pipeline</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Parsed Entities</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!t.documents || t.documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No documents attached yet for this bid. Upload files below to initiate AI
                    parsing.
                  </td>
                </tr>
              ) : (
                t.documents.map((E) => (
                  <tr key={E.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-pine-50 text-pine-800 font-bold flex items-center justify-center border border-pine-200 flex-shrink-0">
                          <FileTextIcon className="w-4 h-4 text-pine-700" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-xs">
                            {E.file_name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {'Added: '}
                            {new Date(E.created_at || Date.now()).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                          {E.classified_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-pine-800 font-mono font-bold bg-pine-50 px-1.5 py-0.5 rounded border border-pine-200">
                          {Math.round((E.classification_confidence || 0.95) * 100)}% Match
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="uppercase text-[10px] bg-slate-100 font-bold px-1.5 py-0.5 rounded mr-1">
                        {E.file_type || 'PDF'}
                      </span>
                      {E.file_size_kb}
                      {' KB'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-pine-100 text-pine-800 border border-pine-200">
                        <CircleCheckBigIcon className="w-3 h-3 text-pine-600" />
                        {E.ocr_status || 'PROCESSED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {E.extracted_fields && E.extracted_fields.length > 0 ? (
                          E.extracted_fields.slice(0, 3).map((T) => (
                            <span
                              key={T.id}
                              className="text-[10px] bg-pine-50 text-pine-900 px-1.5 py-0.5 rounded border border-pine-200 font-mono"
                            >
                              <strong>{T.field_name}:</strong> {T.extracted_value}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {'Layout & Text Extracted'}
                          </span>
                        )}
                        {E.extracted_fields && E.extracted_fields.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            +{E.extracted_fields.length - 3}
                            {' more'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            (c(E), f(null), p(true));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-pine-50 hover:bg-pine-900 text-pine-800 hover:text-white font-bold rounded-xl transition-all border border-pine-200 text-[11px]"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => b(E.id, E.file_name)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DocumentUploader bidId={t.id} onUploadSuccess={() => x(t.id)} />
      <DocumentReviewModal
        isOpen={d}
        onClose={() => p(false)}
        document={l}
        complianceResult={u}
        bidderName={t.bidder.company_name}
        bidId={t.id}
        onSaveSuccess={() => x(t.id)}
      />
      <OfficerDecisionModal isOpen={h} onClose={() => y(false)} bid={t} onSubmit={m} />
    </div>
  );
};
