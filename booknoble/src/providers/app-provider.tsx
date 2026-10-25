import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { repo, type Session } from '@/lib/data';
import type { Business } from '@/lib/types';

interface AppState {
  ready: boolean;
  session: Session | null;
  business: Business | null;
  refreshBusiness: () => Promise<Business | null>;
  setBusiness: (b: Business | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const refreshBusiness = useCallback(async () => {
    const b = await repo.getMyBusiness().catch(() => null);
    setBusiness(b);
    return b;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await repo.getSession().catch(() => null);
      if (!alive) return;
      setSession(s);
      if (s) await refreshBusiness();
      if (alive) setReady(true);
    })();
    const off = repo.onAuthChange(async (s) => {
      setSession(s);
      if (s) await refreshBusiness();
      else setBusiness(null);
    });
    return () => {
      alive = false;
      off();
    };
  }, [refreshBusiness]);

  const value = useMemo(
    () => ({ ready, session, business, refreshBusiness, setBusiness }),
    [ready, session, business, refreshBusiness],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

/** For screens that only render once setup is complete. */
export function useBusiness(): Business {
  const { business } = useApp();
  if (!business) throw new Error('Business not loaded');
  return business;
}
