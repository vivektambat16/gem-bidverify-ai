import { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext(undefined);

export const SidebarProvider = ({ children: e }) => {
  const [t, r] = useState(() => {
      try {
        const l = localStorage.getItem('gem_sidebar_expanded');
        return l !== null ? l === 'true' : true;
      } catch {
        return true;
      }
    }),
    [n, i] = useState(false);
  (useEffect(() => {
    try {
      localStorage.setItem('gem_sidebar_expanded', String(t));
    } catch {}
  }, [t]),
    useEffect(() => {
      const l = (c) => {
        (c.ctrlKey || c.metaKey) &&
          c.key.toLowerCase() === 'b' &&
          (c.preventDefault(), r((u) => !u));
      };
      return (
        window.addEventListener('keydown', l),
        () => window.removeEventListener('keydown', l)
      );
    }, []));
  const a = () => {
      r((l) => !l);
    },
    o = () => {
      i((l) => !l);
    };
  return (
    <SidebarContext.Provider
      value={{
        isExpanded: t,
        setIsExpanded: r,
        toggleSidebar: a,
        isMobileOpen: n,
        setIsMobileOpen: i,
        toggleMobile: o,
      }}
    >
      {e}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const e = useContext(SidebarContext);
  if (!e) throw new Error('useSidebar must be used within a SidebarProvider');
  return e;
};
