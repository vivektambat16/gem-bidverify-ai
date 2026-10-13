const memoryFallback = {};

const safeStorage = {
  getItem: (e) => {
    try {
      return localStorage.getItem(e);
    } catch {
      return memoryFallback[e] || null;
    }
  },
  setItem: (e, t) => {
    try {
      localStorage.setItem(e, t);
    } catch {
      memoryFallback[e] = t;
    }
  },
  removeItem: (e) => {
    try {
      localStorage.removeItem(e);
    } catch {
      delete memoryFallback[e];
    }
  },
};

export function loadState(e, t) {
  try {
    const r = safeStorage.getItem(`gem_ai_${e}`);
    return r ? JSON.parse(r) : t;
  } catch {
    return t;
  }
}

export function saveState(e, t) {
  try {
    safeStorage.setItem(`gem_ai_${e}`, JSON.stringify(t));
  } catch {}
}
