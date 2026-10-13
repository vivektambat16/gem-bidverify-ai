import { useRef, useState } from 'react';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CloudUploadIcon,
  LoaderCircleIcon,
  SparklesIcon,
} from 'lucide-react';
import { api } from '../../api';

const documentTypeOptions = [
  { value: 'AUTO', label: '🤖 AI Auto-Detect & Classify' },
  { value: 'GST_CERTIFICATE', label: 'GST Registration Certificate' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'UDYAM_CERTIFICATE', label: 'Udyam / MSME Certificate' },
  { value: 'ITR_AND_FINANCIALS', label: 'Audited ITR & CA Turnover Certificate' },
  { value: 'OEM_AUTHORIZATION', label: 'OEM Authorization Letter (MAF)' },
  { value: 'MAKE_IN_INDIA', label: 'Make in India Local Content Declaration' },
  { value: 'EPFO_CHALLAN', label: 'EPFO Registration / ECR Challan' },
  { value: 'ESIC_CERTIFICATE', label: 'ESIC Registration Certificate' },
  { value: 'DEBARMENT_AFFIDAVIT', label: 'Non-Blacklisting / Debarment Affidavit' },
  { value: 'BIS_CERTIFICATE', label: 'BIS / ISO Standard Certificate' },
];

export const DocumentUploader = ({ bidId: e, onUploadSuccess: t }) => {
  const [r, n] = useState('AUTO'),
    [i, a] = useState(false),
    [o, l] = useState(false),
    [c, u] = useState(null),
    f = useRef(null),
    d = async (p) => {
      if (!p || p.length === 0) return;
      const h = p[0];
      if (h.size > 25 * 1024 * 1024) {
        u({ type: 'error', text: 'File exceeds maximum 25MB limit.' });
        return;
      }
      try {
        (l(true),
          u(null),
          await api.uploadDocument(e, h, r),
          u({
            type: 'success',
            text: `Uploaded '${h.name}'! AI successfully performed OCR, classification, and field extraction.`,
          }),
          t(),
          f.current && (f.current.value = ''));
      } catch (y) {
        u({ type: 'error', text: y.message || 'Failed to upload and process document' });
      } finally {
        l(false);
      }
    };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-pine-700" />
            {'Upload & AI Document Extraction Pipeline'}
          </h4>
          <p className="text-[11px] text-slate-500">
            Supported formats: PDF, PNG, JPG (Max 25MB). Automatically executes OCR, document
            classification, and coordinate mapping.
          </p>
        </div>
        <select
          value={r}
          onChange={(p) => n(p.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-pine-600 focus:outline-none"
        >
          {documentTypeOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div
        onDragOver={(p) => {
          (p.preventDefault(), a(true));
        }}
        onDragLeave={() => a(false)}
        onDrop={(p) => {
          (p.preventDefault(), a(false), d(p.dataTransfer.files));
        }}
        onClick={() => {
          var p;
          return (p = f.current) == null ? undefined : p.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${i ? 'border-pine-600 bg-pine-50/70 scale-[0.99]' : 'border-slate-300 hover:border-pine-500 hover:bg-pine-50/30'}`}
      >
        <input
          type="file"
          ref={f}
          onChange={(p) => d(p.target.files)}
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        {o ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <LoaderCircleIcon className="w-9 h-9 text-pine-600 animate-spin" />
            <p className="text-xs font-bold text-slate-800">
              Processing Document Through AI Pipeline...
            </p>
            <p className="text-[10.5px] text-slate-500 font-mono">
              Running OCR → Entity Extraction → GFR Rule Verification
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-pine-50 flex items-center justify-center text-pine-700 shadow-sm border border-pine-200">
              <CloudUploadIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop bid documents here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                GST, PAN, ITR, Udyam, OEM Authorization, Make in India Declarations
              </p>
            </div>
          </div>
        )}
      </div>
      {c && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${c.type === 'success' ? 'bg-pine-50 text-pine-900 border-pine-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}
        >
          {c.type === 'success' ? (
            <CircleCheckIcon className="w-4 h-4 text-pine-600 flex-shrink-0" />
          ) : (
            <CircleAlertIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-medium">{c.text}</span>
        </div>
      )}
    </div>
  );
};
