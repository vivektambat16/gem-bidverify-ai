/**
 * Real API client: talks to the FastAPI backend (see /backend).
 * Same method names as mockApi.js so the screens work with either.
 */
const configuredBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL;
const defaultBase = import.meta.env.PROD
  ? 'https://gem-bidverify-ai.onrender.com/api'
  : '/api';
const baseWithoutTrailingSlash = (configuredBase || defaultBase).replace(/\/+$/, '');
const BASE = /\/api$/i.test(baseWithoutTrailingSlash)
  ? baseWithoutTrailingSlash
  : `${baseWithoutTrailingSlash}/api`;
const TOKEN_KEY = 'gem_officer_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 8000.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    let message = data.detail;
    if (Array.isArray(message)) message = message.map((e) => e.msg).join('; ');
    if (response.status === 401 && token) window.dispatchEvent(new Event('gem:unauthorized'));
    if (!message && response.status >= 500) {
      throw new Error(
        `The server did not answer correctly (status ${response.status}). Check that the backend window is running and shows no red error.`,
      );
    }
    throw new Error(message || `Request failed (${response.status})`);
  }
  return response.json();
}

const post = (path, body) => request(path, { method: 'POST', body });

export const api = {
  // authentication
  login: (credentials) => post('/auth/login', credentials),
  sendOtp: (data) => post('/auth/send-otp', data),
  verifyOtp: (data) => post('/auth/verify-2fa', data),
  resetPassword: (data) => post('/auth/reset-password', data),
  register: (data) => post('/auth/register', data),

  // dashboard
  getDashboardStats: () => request('/dashboard'),

  // tenders and bidders
  getTenders: () => request('/tenders'),
  getTender: (id) => request(`/tenders/${encodeURIComponent(id)}`),
  createTender: (data) => post('/tenders', data),
  addRequirement: (tenderId, data) => post(`/tenders/${tenderId}/requirements`, data),
  getBidders: () => request('/bidders'),
  createBidder: (data) => post('/bidders', data),

  // bids
  getBids: (tenderId) =>
    request(tenderId ? `/bids?tender_id=${encodeURIComponent(tenderId)}` : '/bids'),
  getBid: (id) => request(`/bids/${encodeURIComponent(id)}`),
  createBid: (data) => post('/bids', data),
  uploadDocument: (bidId, file, typeHint) => {
    const form = new FormData();
    form.append('file', file);
    if (typeHint) form.append('classified_type_hint', typeHint);
    return request(`/bids/${bidId}/documents`, { method: 'POST', formData: form });
  },
  deleteDocument: (bidId, documentId) =>
    request(`/bids/${bidId}/documents/${documentId}`, { method: 'DELETE' }),
  updateComplianceResult: (bidId, resultId, data) =>
    request(`/bids/${bidId}/compliance/${resultId}`, { method: 'PUT', body: data }),
  verifyBid: (bidId) => post(`/bids/${bidId}/verify`),
  submitOfficerDecision: (bidId, data) => post(`/bids/${bidId}/decision`, data),

  // integrations (simulated adapters on the server)
  getIntegrationsStatus: () => request('/integrations/status'),
  testGST: (gstin) => post(`/integrations/test-gst?gstin=${encodeURIComponent(gstin)}`),
  testPAN: (pan) => post(`/integrations/test-pan?pan=${encodeURIComponent(pan)}`),
  testDebarment: (companyName, pan) =>
    post(
      `/integrations/test-debarment?company_name=${encodeURIComponent(companyName)}&pan=${encodeURIComponent(pan || '')}`,
    ),

  // audit, notifications, administration
  getAuditLogs: () => request('/audit'),
  verifyAuditChain: () => request('/audit/verify'),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => post(`/notifications/${id}/read`),
  exportData: () => request('/admin/export'),
  importData: async () => {
    throw new Error('Importing a backup is only available in offline demo mode.');
  },
  resetData: () => post('/admin/reset-demo'),
};
