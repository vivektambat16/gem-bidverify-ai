/**
 * Chooses the data source for the whole app.
 *   default            -> real backend (FastAPI on port 8000, proxied as /api in dev)
 *   VITE_API_MODE=mock -> offline demo using browser localStorage (no server needed)
 */
import { api as httpApi } from './httpApi';
import { api as mockApi } from './mockApi';

export const api = import.meta.env.VITE_API_MODE === 'mock' ? mockApi : httpApi;
