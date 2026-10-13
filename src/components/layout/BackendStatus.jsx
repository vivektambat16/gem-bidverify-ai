import { useEffect, useState } from 'react';

/**
 * Shows a red bar at the top of the portal when the backend server is not answering.
 * Without this, every screen would just keep showing its loading spinner.
 */
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:8000/api'
    : '/api');

async function backendIsUp() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${BASE}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export const BackendStatus = () => {
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (import.meta.env.VITE_API_MODE === 'mock') return undefined;
    let cancelled = false;
    let timer;
    const check = async () => {
      const up = await backendIsUp();
      if (cancelled) return;
      setDown((wasDown) => {
        // when the server comes back, reload once so the screens fetch their data again
        if (wasDown && up) window.location.reload();
        return !up;
      });
      timer = setTimeout(check, up ? 15000 : 4000);
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!down) return null;
  return (
    <div
      role="alert"
      className="bg-rose-700 text-white text-xs font-semibold px-4 py-2 text-center"
    >
      The backend server is not running, so no data can load. Start it with start-backend.bat (or
      start-all.bat) and keep that black window open. This page reloads by itself when the server is
      back.
    </div>
  );
};
