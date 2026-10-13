import { loadState, saveState } from './storage';
import {
  seedAuditLogs,
  seedBidders,
  seedBids,
  seedConnectors,
  seedNotifications,
  seedTenders,
  seedUsers,
} from './seedData';

const IS_FILE_PROTOCOL = typeof window < 'u' && window.location.protocol === 'file:';

const API_BASE = IS_FILE_PROTOCOL ? 'http://localhost:8000/api' : '/api';

let tendersStore = loadState('tenders', seedTenders);

let biddersStore = loadState('bidders', seedBidders);

let bidsStore = loadState('bids', seedBids);

let auditStore = loadState('audit_logs', seedAuditLogs);

let notificationsStore = loadState('notifications', seedNotifications);

let usersStore = loadState('users', seedUsers);

if (usersStore && Array.isArray(usersStore)) {
  let e = false;
  ((usersStore = usersStore.map((t) =>
    t.username === 'officer' ||
    !t.email ||
    t.email.endsWith('@gem.gov.in') ||
    t.email.includes('rajesh.verma')
      ? ((e = true), { ...t, email: 'officer@example.gov.in' })
      : t,
  )),
    e && saveState('users', usersStore));
}

export let otpStore = {};

function addAuditLog(e, t, r = 'BID', n) {
  ((auditStore = [
    {
      id: Date.now(),
      bid_id: n,
      user_name: 'Rajesh Kumar Verma',
      action: e,
      entity_type: r,
      details: t,
      rule_applied: 'GFR_2017_RULE_149',
      ip_address: '10.12.89.44 (NIC Network)',
      timestamp: new Date().toISOString(),
    },
    ...auditStore,
  ]),
    saveState('audit_logs', auditStore));
}

async function requestWithFallback(e, t, r) {
  if (!(typeof window < 'u' && window.location.protocol === 'https:') || !e.startsWith('http://'))
    try {
      const i = new AbortController(),
        a = setTimeout(() => i.abort(), 3e3),
        o = await fetch(e, { ...t, signal: i.signal });
      if ((clearTimeout(a), !o.ok)) {
        const l = await o.json().catch(() => ({ detail: `HTTP ${o.status}` }));
        throw new Error(l.detail || l.message || `Request failed with status ${o.status}`);
      }
      return await o.json();
    } catch {}
  if (r) return await r();
  throw new Error('Endpoint and fallback failed.');
}

export const api = {
  login: async (e) =>
    requestWithFallback(
      `${API_BASE}/auth/login`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = usersStore.find((n) => n.username === e.username && n.password === e.password);
        if (!t) throw new Error('Invalid username or password.');
        const r = {
          id: t.id,
          username: t.username,
          full_name: t.full_name,
          role: t.role,
          department: t.department,
          email: t.email,
          phone: t.phone,
          is_active: true,
        };
        return (
          addAuditLog(
            'OFFICER_LOGIN',
            `Officer '${r.full_name}' authenticated via GeM console.`,
            'AUTH',
          ),
          { access_token: 'gem_officer_token_standalone_2026', token_type: 'bearer', user: r }
        );
      },
    ),
  sendOtp: async (e) =>
    requestWithFallback(
      `${API_BASE}/auth/send-otp`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      async () => {
        const t = e.username || 'officer',
          r = usersStore.find((o) => o.username === t || (e.email && o.email === e.email)),
          n = e.email || (r == null ? undefined : r.email) || 'officer@example.gov.in',
          i = Math.floor(100000 + Math.random() * 900000).toString();
        let a = n;
        if (n.includes('@')) {
          const [o, l] = n.split('@');
          o.length <= 2
            ? (a = `${o}*@${l}`)
            : (a = o.slice(0, 2) + '*'.repeat(Math.max(2, o.length - 3)) + o.slice(-1) + '@' + l);
        }
        console.log(
          `%c[GeM 2FA Security Gateway] Verification OTP for ${n}: ${i}`,
          'color:#14B8A6;font-weight:bold;font-size:13px;',
        );
        try {
          sessionStorage.setItem('gem_last_otp', i);
        } catch {}
        return (
          (otpStore[t] = { otp: i, email: n, expiresAt: Date.now() + 5 * 60 * 1e3, attempts: 0 }),
          (otpStore[n] = otpStore[t]),
          { success: true, message: `OTP sent to ${a}`, masked_email: a, email_masked: a, otp: i }
        );
      },
    ),
  verifyOtp: async (e) =>
    requestWithFallback(
      `${API_BASE}/auth/verify-2fa`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = otpStore[e.username] || otpStore[e.email];
        if (!t || !t.otp) throw new Error('No active OTP found. Please request a new OTP.');
        if (Date.now() > t.expiresAt) {
          delete otpStore[e.username];
          throw new Error('OTP has expired. Please request a new one.');
        }
        if (t.otp !== e.otp) {
          t.attempts = (t.attempts || 0) + 1;
          if (t.attempts >= 5) {
            delete otpStore[e.username];
            throw new Error('Too many failed attempts. Please request a new OTP.');
          }
          throw new Error('Invalid OTP code. Please check and try again.');
        }
        delete otpStore[e.username];
        const n =
            usersStore.find((a) => a.username === e.username || a.email === e.username) ||
            usersStore[0],
          i = {
            id: (n == null ? undefined : n.id) || 1,
            username: (n == null ? undefined : n.username) || 'officer',
            full_name: (n == null ? undefined : n.full_name) || 'Rajesh Kumar Verma',
            role: (n == null ? undefined : n.role) || 'Procurement Officer',
            department:
              (n == null ? undefined : n.department) ||
              'Department of Electronics & IT (GeM Evaluation Cell)',
            email: 'officer@example.gov.in',
            phone: (n == null ? undefined : n.phone) || '+91 98200 12345',
            is_active: true,
          };
        return (
          addAuditLog('2FA_VERIFIED', `2FA OTP verified for '${i.full_name}'.`, 'AUTH'),
          { access_token: `gem_token_${Date.now()}`, token_type: 'bearer', user: i }
        );
      },
    ),
  resetPassword: async (e) =>
    requestWithFallback(
      `${API_BASE}/auth/reset-password`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = e.username || e.email || 'officer',
          r = otpStore[t] || otpStore.officer;
        if (!r || !r.otp) throw new Error('No active OTP found. Please request a new OTP.');
        if (Date.now() > r.expiresAt) {
          delete otpStore[t];
          throw new Error('OTP has expired. Please request a new one.');
        }
        if (r.otp !== e.otp) throw new Error('Invalid OTP code. Please check and try again.');
        const i = usersStore.find(
          (a) => a.username === e.username || a.email === e.email || a.username === 'officer',
        );
        return (
          i && ((i.password = e.new_password), saveState('users', usersStore)),
          delete otpStore[t],
          addAuditLog(
            'PASSWORD_RESET',
            `Password successfully reset for user '${(i == null ? undefined : i.username) || t}'.`,
            'AUTH',
          ),
          {
            success: true,
            message:
              'Password has been successfully updated. Please sign in with your new password.',
          }
        );
      },
    ),
  register: async (e) =>
    requestWithFallback(
      `${API_BASE}/auth/register`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        if (e.username === 'officer')
          throw new Error("Username 'officer' is reserved for default evaluation.");
        usersStore = usersStore.filter((n) => n.username !== e.username && n.email !== e.email);
        const t = {
          id: Date.now(),
          username: e.username,
          full_name: e.full_name,
          role: 'Procurement Officer',
          department: e.department || 'Department of Electronics & IT (GeM Evaluation Cell)',
          email: e.email,
          phone: e.phone || '',
          password: e.password,
          is_active: true,
        };
        ((usersStore = [...usersStore, t]),
          saveState('users', usersStore),
          addAuditLog(
            'ACCOUNT_CREATED',
            `New account created for '${t.full_name}' (${t.username}).`,
            'AUTH',
          ));
        const r = {
          id: t.id,
          username: t.username,
          full_name: t.full_name,
          role: t.role,
          department: t.department,
          email: t.email,
          phone: t.phone,
          is_active: true,
        };
        return { access_token: `gem_token_${Date.now()}`, token_type: 'bearer', user: r };
      },
    ),
  getDashboardStats: async () =>
    requestWithFallback(`${API_BASE}/dashboard`, undefined, () => {
      const e = bidsStore.filter((a) => a.status === 'VERIFIED' || a.status === 'APPROVED').length,
        t = bidsStore.filter((a) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL').length,
        r = bidsStore.filter(
          (a) => a.status === 'UNDER_VERIFICATION' || a.status === 'PENDING_REVIEW',
        ).length,
        n = bidsStore.filter(
          (a) => a.status === 'PENDING_REVIEW' || a.risk_level === 'MEDIUM',
        ).length;
      return {
        total_tenders: tendersStore.length,
        active_tenders: tendersStore.filter((a) => a.status === 'ACTIVE').length,
        bids_under_verification: r,
        verified_bids: e,
        high_risk_bids: t,
        pending_reviews: n,
        compliance_overview: {
          Compliant: bidsStore.filter((a) => a.compliance_score >= 80).length,
          'Review Required': bidsStore.filter(
            (a) => a.compliance_score >= 60 && a.compliance_score < 80,
          ).length,
          'Non-Compliant': bidsStore.filter((a) => a.compliance_score < 60).length,
        },
        risk_distribution: {
          Low: bidsStore.filter((a) => a.risk_level === 'LOW').length,
          Medium: bidsStore.filter((a) => a.risk_level === 'MEDIUM').length,
          High: bidsStore.filter((a) => a.risk_level === 'HIGH').length,
          Critical: bidsStore.filter((a) => a.risk_level === 'CRITICAL').length,
        },
        verification_activity: [
          { date: 'Day 1', verified: 1, flagged: 0 },
          { date: 'Day 2', verified: 2, flagged: 1 },
          { date: 'Day 3', verified: 4, flagged: 1 },
          { date: 'Day 4', verified: 5, flagged: 2 },
          { date: 'Day 5', verified: 7, flagged: 2 },
          { date: 'Today', verified: 8, flagged: 3 },
        ],
        recent_bids: bidsStore.map((a) => {
          var o;
          return {
            id: a.id,
            bid_id: a.bid_id,
            bidder_name: a.bidder.company_name,
            tender_id:
              ((o = tendersStore.find((l) => l.id === a.tender_id)) == null
                ? undefined
                : o.tender_id) || 'GEM/2026/B/12345',
            documents_count: a.documents.length,
            compliance_score: a.compliance_score,
            risk_level: a.risk_level,
            status: a.status,
            last_verified: new Date(a.submission_date).toLocaleDateString('en-IN'),
          };
        }),
      };
    }),
  getTenders: async () =>
    requestWithFallback(`${API_BASE}/tenders`, undefined, () => [...tendersStore]),
  getTender: async (e) =>
    requestWithFallback(`${API_BASE}/tenders/${e}`, undefined, () => {
      const t = tendersStore.find((r) => String(r.id) === String(e) || r.tender_id === String(e));
      if (!t) throw new Error('Tender not found');
      return t;
    }),
  createTender: async (e) =>
    requestWithFallback(
      `${API_BASE}/tenders`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = {
          id: Date.now(),
          tender_id: e.tender_id || `GEM/2026/B/${Math.floor(1e4 + Math.random() * 9e4)}`,
          title: e.title,
          department: e.department,
          tender_value: Number(e.tender_value) || 5e6,
          deadline: e.deadline || new Date(Date.now() + 12096e5).toISOString().split('T')[0],
          status: 'ACTIVE',
          description: e.description || '',
          created_at: new Date().toISOString(),
          bids_count: 0,
          requirements: (e.requirements || []).map((r, n) => ({
            id: n + 1,
            requirement_code: r.requirement_code,
            requirement_name: r.requirement_name,
            is_mandatory: r.is_mandatory ?? true,
            verification_source: r.verification_source || 'PORTAL_CROSS_CHECK',
            min_condition: r.min_condition || 'Standard GFR Rule 149 condition',
            weight: Number(r.weight) || 10,
            applicable_bidder_type: r.applicable_bidder_type || 'ALL',
          })),
        };
        return (
          (tendersStore = [t, ...tendersStore]),
          saveState('tenders', tendersStore),
          addAuditLog(
            'TENDER_PUBLISHED',
            `New Tender '${t.tender_id}' published: ${t.title}`,
            'TENDER',
          ),
          t
        );
      },
    ),
  addRequirement: async (e, t) =>
    requestWithFallback(
      `${API_BASE}/tenders/${e}/requirements`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) },
      () => {
        const r = tendersStore.find((n) => n.id === e);
        return (
          r && (r.requirements.push({ id: Date.now(), ...t }), saveState('tenders', tendersStore)),
          { success: true }
        );
      },
    ),
  getBidders: async () =>
    requestWithFallback(`${API_BASE}/bidders`, undefined, () => [...biddersStore]),
  createBidder: async (e) =>
    requestWithFallback(
      `${API_BASE}/bidders`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = {
          id: Date.now(),
          company_name: e.company_name,
          cin: e.cin || undefined,
          pan: (e.pan || '').toUpperCase(),
          gstin: (e.gstin || '').toUpperCase() || undefined,
          registered_address: e.registered_address || undefined,
          contact_email: e.contact_email || undefined,
          contact_phone: e.contact_phone || undefined,
          is_msme: !!e.is_msme,
          msme_reg_no: e.msme_reg_no || undefined,
          is_startup: !!e.is_startup,
          startup_dipp_no: e.startup_dipp_no || undefined,
        };
        return (
          (biddersStore = [t, ...biddersStore]),
          saveState('bidders', biddersStore),
          addAuditLog(
            'BIDDER_REGISTERED',
            `Bidder '${t.company_name}' registered with PAN ${t.pan}`,
            'BIDDER',
          ),
          t
        );
      },
    ),
  getBids: async (e) =>
    requestWithFallback(e ? `${API_BASE}/bids?tender_id=${e}` : `${API_BASE}/bids`, undefined, () =>
      (e ? bidsStore.filter((r) => r.tender_id === e) : bidsStore).map((r) => {
        var n;
        return {
          id: r.id,
          bid_id: r.bid_id,
          tender_id:
            ((n = tendersStore.find((i) => i.id === r.tender_id)) == null
              ? undefined
              : n.tender_id) || 'GEM/2026/B/12345',
          bidder_name: r.bidder.company_name,
          bidder_pan: r.bidder.pan,
          documents_count: r.documents.length,
          compliance_score: r.compliance_score,
          risk_level: r.risk_level,
          status: r.status,
          last_verified: new Date(r.submission_date).toLocaleDateString('en-IN'),
        };
      }),
    ),
  getBid: async (e) =>
    requestWithFallback(`${API_BASE}/bids/${e}`, undefined, () => {
      const t = bidsStore.find((n) => String(n.id) === String(e) || n.bid_id === String(e));
      if (!t) throw new Error('Bid not found');
      const r = tendersStore.find((n) => n.id === t.tender_id);
      return { ...t, tender: r };
    }),
  createBid: async (e) =>
    requestWithFallback(
      `${API_BASE}/bids`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) },
      () => {
        const t = tendersStore.find((l) => l.id === Number(e.tender_id)) || tendersStore[0],
          r = biddersStore.find((l) => l.id === Number(e.bidder_id)) || biddersStore[0],
          n = Math.floor(1e3 + Math.random() * 9e3),
          a = `BID/${t.tender_id.split('/')[3] || '12345'}/${r.company_name.substring(0, 3).toUpperCase()}-${n}`,
          o = {
            id: Date.now(),
            bid_id: a,
            tender_id: t.id,
            bidder_id: r.id,
            submission_date: new Date().toISOString(),
            status: 'UNDER_VERIFICATION',
            compliance_score: 75,
            risk_level: 'LOW',
            ai_recommendation: 'REVIEW_REQUIRED',
            ai_explanation:
              'Standard criteria cross-verified with statutory databases. Awaiting attached certificates for final scoring.',
            bidder: r,
            tender: t,
            documents: [
              {
                id: Date.now() + 1,
                bid_id: 0,
                file_name: `${r.company_name.toLowerCase().replace(/\s+/g, '_')}_pan.pdf`,
                file_type: 'pdf',
                file_size_kb: 195,
                classified_type: 'PAN_CARD',
                classification_confidence: 0.98,
                ocr_status: 'COMPLETED',
                created_at: new Date().toISOString(),
                extracted_fields: [
                  {
                    id: Date.now() + 2,
                    field_name: 'pan_number',
                    extracted_value: r.pan || 'ABCDE1234F',
                    confidence: 0.99,
                    bounding_box: { page: 1, x: 140, y: 160, width: 220, height: 35 },
                    is_verified: true,
                  },
                  {
                    id: Date.now() + 3,
                    field_name: 'legal_name',
                    extracted_value: r.company_name.toUpperCase(),
                    confidence: 0.98,
                    bounding_box: { page: 1, x: 140, y: 210, width: 320, height: 30 },
                    is_verified: true,
                  },
                ],
              },
            ],
            compliance_results: [
              {
                id: Date.now() + 10,
                requirement_code: 'PAN',
                requirement_name: 'Permanent Account Number (PAN) Card',
                status: 'VERIFIED',
                points_awarded: 10,
                max_points: 10,
                evidence_document: `${r.company_name.toLowerCase().replace(/\s+/g, '_')}_pan.pdf`,
                confidence_score: 0.99,
                rule_applied: 'ITD e-PAN Match',
                explanation: `PAN ${r.pan} is verified and matches registered entity name.`,
              },
              {
                id: Date.now() + 11,
                requirement_code: 'GST',
                requirement_name: 'Goods & Services Tax (GST) Registration',
                status: 'VERIFIED',
                points_awarded: 15,
                max_points: 15,
                evidence_document: 'Statutory Verification',
                confidence_score: 0.98,
                rule_applied: 'GSTN Gateway Sync',
                explanation: `GSTIN ${r.gstin || 'Active'} verified in regular status.`,
              },
              {
                id: Date.now() + 12,
                requirement_code: 'DEBARMENT',
                requirement_name: 'Non-Blacklisting / Debarment Affidavit',
                status: 'VERIFIED',
                points_awarded: 10,
                max_points: 10,
                evidence_document: 'CPPP Central Check',
                confidence_score: 1,
                rule_applied: 'CPPP Registry Match',
                explanation: 'No debarment records found.',
              },
            ],
            risk_assessment: {
              id: Date.now() + 20,
              risk_level: 'LOW',
              risk_score: 15,
              risk_factors: [],
              recommendation: 'REVIEW_REQUIRED',
              recommended_action: 'Examine attached proofs and verify credentials',
            },
          };
        return (
          (o.documents[0].bid_id = o.id),
          (t.bids_count = (t.bids_count || 0) + 1),
          (bidsStore = [o, ...bidsStore]),
          saveState('bids', bidsStore),
          saveState('tenders', tendersStore),
          addAuditLog(
            'CREATE_BID_SUBMISSION',
            `Registered new bid '${o.bid_id}' for '${r.company_name}' under tender '${t.tender_id}'.`,
            'BID',
            o.id,
          ),
          o
        );
      },
    ),
  uploadDocument: async (e, t, r) => {
    if (IS_FILE_PROTOCOL) {
      const i = bidsStore.find((u) => u.id === e);
      if (!i) throw new Error('Bid not found');
      const a = t.name,
        o = a.toLowerCase();
      let l = r && r !== 'AUTO' ? r : 'GENERAL_DOCUMENT';
      l === 'GENERAL_DOCUMENT' &&
        (o.includes('pan')
          ? (l = 'PAN_CARD')
          : o.includes('gst')
            ? (l = 'GST_CERTIFICATE')
            : o.includes('udyam') || o.includes('msme')
              ? (l = 'UDYAM_CERTIFICATE')
              : o.includes('itr') || o.includes('turnover') || o.includes('ca')
                ? (l = 'ITR_AND_FINANCIALS')
                : o.includes('oem') || o.includes('maf') || o.includes('auth')
                  ? (l = 'OEM_AUTHORIZATION')
                  : o.includes('mii') || o.includes('make_in_india') || o.includes('local')
                    ? (l = 'MAKE_IN_INDIA')
                    : (o.includes('debar') || o.includes('affidavit')) &&
                      (l = 'DEBARMENT_AFFIDAVIT'));
      const c = {
        id: Date.now(),
        bid_id: e,
        file_name: a,
        file_type: 'pdf',
        file_size_kb: Math.round(t.size / 1024) || 245,
        classified_type: l,
        classification_confidence: 0.97,
        ocr_status: 'COMPLETED',
        created_at: new Date().toISOString(),
        extracted_fields: [
          {
            id: Date.now() + 1,
            field_name: 'entity_name',
            extracted_value: i.bidder.company_name,
            confidence: 0.98,
            bounding_box: { page: 1, x: 120, y: 150, width: 320, height: 35 },
            is_verified: true,
          },
          {
            id: Date.now() + 2,
            field_name: 'document_code',
            extracted_value: l,
            confidence: 0.96,
            bounding_box: { page: 1, x: 120, y: 200, width: 250, height: 30 },
            is_verified: true,
          },
        ],
      };
      return (
        i.documents.push(c),
        saveState('bids', bidsStore),
        addAuditLog(
          'DOCUMENT_UPLOADED',
          `Uploaded document '${a}' classified as ${l} for bid ${i.bid_id}`,
          'DOCUMENT',
          e,
        ),
        c
      );
    }
    const n = new FormData();
    (n.append('file', t), r && n.append('classified_type_hint', r));
    try {
      const i = await fetch(`${API_BASE}/bids/${e}/documents`, { method: 'POST', body: n });
      if (!i.ok) {
        const a = await i.json();
        throw new Error(a.detail || 'Upload failed');
      }
      return i.json();
    } catch {
      return api.uploadDocument(e, t, r);
    }
  },
  deleteDocument: async (e, t) =>
    requestWithFallback(`${API_BASE}/bids/${e}/documents/${t}`, { method: 'DELETE' }, () => {
      const r = bidsStore.find((n) => n.id === e);
      if (r) {
        const n = r.documents.find((i) => i.id === t);
        ((r.documents = r.documents.filter((i) => i.id !== t)),
          saveState('bids', bidsStore),
          addAuditLog(
            'DOCUMENT_DELETED',
            `Deleted document '${(n == null ? undefined : n.file_name) || t}' from bid ${r.bid_id}`,
            'DOCUMENT',
            e,
          ));
      }
      return { success: true };
    }),
  updateComplianceResult: async (e, t, r) =>
    requestWithFallback(
      `${API_BASE}/bids/${e}/compliance/${t}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) },
      () => {
        const n = bidsStore.find((i) => i.id === e);
        if (n) {
          const i = n.compliance_results.find((a) => a.id === t);
          if (i) {
            ((i.points_awarded = Number(r.points_awarded)),
              (i.status = r.status),
              r.explanation && (i.explanation = r.explanation));
            const a = n.compliance_results.reduce((l, c) => l + Number(c.points_awarded), 0),
              o = n.compliance_results.reduce((l, c) => l + Number(c.max_points), 0);
            ((n.compliance_score = o > 0 ? Math.min(100, Math.round((a / o) * 100)) : 80),
              saveState('bids', bidsStore),
              addAuditLog(
                'HUMAN_OFFICER_VERIFICATION_EVALUATION',
                `Officer adjusted score for '${i.requirement_name}' to ${i.points_awarded}/${i.max_points} pts. Total score updated to ${n.compliance_score}/100.`,
                'COMPLIANCE',
                e,
              ));
          }
        }
        return { success: true, compliance_score: n == null ? undefined : n.compliance_score };
      },
    ),
  verifyBid: async (e) =>
    requestWithFallback(`${API_BASE}/bids/${e}/verify`, { method: 'POST' }, () => {
      const t = bidsStore.find((r) => r.id === e);
      if (!t) throw new Error('Bid not found');
      return (
        (t.compliance_score = Math.min(100, t.compliance_score + 5)),
        (t.status = 'VERIFIED'),
        saveState('bids', bidsStore),
        addAuditLog(
          'BID_COMPLIANCE_RE_VERIFIED',
          `AI verification pipeline re-executed for ${t.bid_id}. Score: ${t.compliance_score}/100.`,
          'BID',
          e,
        ),
        t
      );
    }),
  submitOfficerDecision: async (e, t) =>
    requestWithFallback(
      `${API_BASE}/bids/${e}/decision`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) },
      () => {
        const r = bidsStore.find((i) => i.id === e);
        if (!r) throw new Error('Bid not found');
        const n = {
          id: Date.now(),
          officer_name: 'Rajesh Kumar Verma',
          decision: t.decision,
          comments: t.comments,
          clarification_details: t.clarification_details,
          decided_at: new Date().toISOString(),
        };
        return (
          (r.officer_decision = n),
          (r.status =
            t.decision === 'APPROVED'
              ? 'APPROVED'
              : t.decision === 'REJECTED'
                ? 'REJECTED'
                : 'REQUIRES_CLARIFICATION'),
          saveState('bids', bidsStore),
          addAuditLog(
            `OFFICER_DECISION_${t.decision}`,
            `Officer signed decision '${t.decision}' for bid ${r.bid_id}. Remarks: ${t.comments}`,
            'DECISION',
            e,
          ),
          { success: true, officer_decision: n }
        );
      },
    ),
  getIntegrationsStatus: async () =>
    requestWithFallback(`${API_BASE}/integrations/status`, undefined, () => ({
      connectors: seedConnectors,
      disclaimer:
        'All statutory connectors configured with mTLS certificates, IP whitelisting, and GFR 2017 compliant audit streaming.',
    })),
  testGST: async (e) =>
    requestWithFallback(
      `${API_BASE}/integrations/test-gst?gstin=${encodeURIComponent(e)}`,
      { method: 'POST' },
      () => {
        const t = e.trim().toUpperCase();
        return t.includes('BHART') || t.includes('9999')
          ? {
              gstin: t,
              status: 'SUSPENDED',
              legal_name: 'Bharat Systems Pvt Ltd',
              state: 'Rajasthan (08)',
              taxpayer_type: 'Regular',
              filing_status: 'Defaulted / GSTR-3B overdue for 4 quarters',
              flag: 'HIGH_RISK_DEFAULTER',
            }
          : {
              gstin: t,
              status: 'ACTIVE',
              legal_name: 'ABC Technologies Pvt Ltd',
              state: 'Maharashtra (27)',
              taxpayer_type: 'Regular',
              filing_status: 'Clean Filing Record (All returns submitted up to date)',
              flag: 'COMPLIANT',
            };
      },
    ),
  testPAN: async (e) =>
    requestWithFallback(
      `${API_BASE}/integrations/test-pan?pan=${encodeURIComponent(e)}`,
      { method: 'POST' },
      () => {
        const t = e.trim().toUpperCase();
        return {
          pan: t,
          status: 'VALID',
          entity_name: t.includes('ABC')
            ? 'ABC TECHNOLOGIES PVT LTD'
            : t.includes('XYZ')
              ? 'XYZ SOLUTIONS LIMITED'
              : 'REGISTERED CORPORATE ENTITY',
          entity_type: 'Company',
          aadhaar_seeded: true,
          itd_verification: 'Active & In Good Standing',
        };
      },
    ),
  testDebarment: async (e, t) =>
    requestWithFallback(
      `${API_BASE}/integrations/test-debarment?company_name=${encodeURIComponent(e)}&pan=${encodeURIComponent(t || '')}`,
      { method: 'POST' },
      () =>
        e.toLowerCase().includes('bharat') || (t && t.includes('BHART'))
          ? {
              company_name: e,
              status: 'DEBARRED_MATCH_FOUND',
              severity: 'CRITICAL',
              ministry: 'Ministry of Defence (Acquisition Wing)',
              order_number: 'MOD/DEB/2025/892',
              period: '2 Years (Active until 15-Nov-2027)',
              reason: 'Submission of fabricated experience credentials in defense procurement',
              gfr_rule: 'Mandatory disqualification under GFR Rule 151',
            }
          : {
              company_name: e,
              status: 'NO_DEBARMENT_RECORD',
              severity: 'CLEAR',
              ministry: 'All Central Ministries & CPSUs',
              records_checked: 14200,
              gfr_rule: 'Clear for participation under GFR 2017',
            },
    ),
  getAuditLogs: async (e) =>
    requestWithFallback(e ? `${API_BASE}/audit?bid_id=${e}` : `${API_BASE}/audit`, undefined, () =>
      e ? auditStore.filter((t) => t.bid_id === e) : auditStore,
    ),
  getNotifications: async () =>
    requestWithFallback(`${API_BASE}/notifications`, undefined, () => [...notificationsStore]),
  markNotificationRead: async (e) =>
    requestWithFallback(`${API_BASE}/notifications/${e}/read`, { method: 'POST' }, () => {
      const t = notificationsStore.find((r) => r.id === e);
      return (
        t && (t.is_read = true),
        saveState('notifications', notificationsStore),
        { success: true }
      );
    }),
  exportData: () => ({
    appName: 'GeM BidVerify AI',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    tenders: tendersStore,
    bidders: biddersStore,
    bids: bidsStore,
    audit_logs: auditStore,
    users: usersStore,
  }),
  importData: (e) => (
    e.tenders &&
      Array.isArray(e.tenders) &&
      ((tendersStore = e.tenders), saveState('tenders', tendersStore)),
    e.bidders &&
      Array.isArray(e.bidders) &&
      ((biddersStore = e.bidders), saveState('bidders', biddersStore)),
    e.bids && Array.isArray(e.bids) && ((bidsStore = e.bids), saveState('bids', bidsStore)),
    e.audit_logs &&
      Array.isArray(e.audit_logs) &&
      ((auditStore = e.audit_logs), saveState('audit_logs', auditStore)),
    e.users && Array.isArray(e.users) && ((usersStore = e.users), saveState('users', usersStore)),
    addAuditLog(
      'DATA_PACKAGE_IMPORTED',
      'All procurement and evaluation records imported from external backup package.',
      'SYSTEM',
    ),
    { success: true, message: 'All procurement and evaluation records imported successfully!' }
  ),
  resetData: () => (
    (tendersStore = [...seedTenders]),
    (biddersStore = [...seedBidders]),
    (bidsStore = [...seedBids]),
    (auditStore = [...seedAuditLogs]),
    (usersStore = [...seedUsers]),
    saveState('tenders', tendersStore),
    saveState('bidders', biddersStore),
    saveState('bids', bidsStore),
    saveState('audit_logs', auditStore),
    saveState('users', usersStore),
    addAuditLog(
      'DATA_RESET_DEFAULT',
      'Restored official GFR 2017 baseline procurement and evaluation records.',
      'SYSTEM',
    ),
    { success: true }
  ),
};
