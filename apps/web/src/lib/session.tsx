import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DentistesClient, type MeResponse, type OnboardingInput, type OnboardingResponse } from "@dentistes/sdk";
import { currentTenantSubdomain } from "./tenant";

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
export const WORKDAY_MAX_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours (full workday)
export const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes proactive renewal

export const STORAGE_KEY_LAST_ACTIVITY = "dentistes_last_activity";
export const STORAGE_KEY_SESSION_START = "dentistes_session_start";

export function recordActivity(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(Date.now()));
  } catch {}
}

export function initSessionTimers(): void {
  const now = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY_SESSION_START, String(now));
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
  } catch {}
}

export function clearSessionTimers(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION_START);
    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
  } catch {}
}

export function isSessionExpiredByInactivity(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (!last) return false;
    const elapsed = Date.now() - Number(last);
    return elapsed > INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}

export function isSessionExpiredByWorkday(): boolean {
  try {
    const start = localStorage.getItem(STORAGE_KEY_SESSION_START);
    if (!start) return false;
    const elapsed = Date.now() - Number(start);
    return elapsed > WORKDAY_MAX_DURATION_MS;
  } catch {
    return false;
  }
}

interface SessionValue {
  sdk: DentistesClient;
  me: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { tenant_name: string; subdomain: string; email: string; password: string; full_name: string }) => Promise<void>;
  onboarding: (input: OnboardingInput) => Promise<OnboardingResponse>;
  logout: (reason?: string) => Promise<void>;
  reload: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export const sdk = new DentistesClient({
  baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  mode: "browser",
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (reason?: string) => {
    // 1. Immediately clear local session state so UI unmounts all protected views instantly
    setMe(null);
    clearSessionTimers();

    try {
      await sdk.logout();
    } catch {
      // ignore network errors on logout
    }

    // 2. Redirect cleanly to /login with reason
    const dest = reason ? `/login?reason=${encodeURIComponent(reason)}` : "/login";
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.replace(dest);
    }
  }, []);

  // Hook 401 unauthenticated responses from API directly into logout
  useEffect(() => {
    sdk.setOnUnauthorized(() => {
      void logout("unauthorized");
    });
    return () => {
      sdk.setOnUnauthorized(undefined);
    };
  }, [logout]);

  useEffect(() => {
    let active = true;

    // Check if session has expired prior to bootstrapping
    if (isSessionExpiredByInactivity()) {
      clearSessionTimers();
      sdk.logout().catch(() => undefined);
      setMe(null);
      setLoading(false);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login?reason=inactivity");
      }
      return;
    }

    if (isSessionExpiredByWorkday()) {
      clearSessionTimers();
      sdk.logout().catch(() => undefined);
      setMe(null);
      setLoading(false);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login?reason=workday");
      }
      return;
    }

    sdk.bootstrap().then((value) => {
      if (active) {
        if (value) {
          // Initialize session start timer if not set
          try {
            if (!localStorage.getItem(STORAGE_KEY_SESSION_START)) {
              localStorage.setItem(STORAGE_KEY_SESSION_START, String(Date.now()));
            }
            recordActivity();
          } catch {}
          setMe(value);
        } else {
          clearSessionTimers();
          setMe(null);
        }
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Inactivity tracking and sliding renewal listeners
  useEffect(() => {
    if (!me) return;

    let lastRecorded = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();

      if (isSessionExpiredByInactivity()) {
        void logout("inactivity");
        return;
      }
      if (isSessionExpiredByWorkday()) {
        void logout("workday");
        return;
      }

      // Throttle updating localStorage to once every 10 seconds
      if (now - lastRecorded > 10_000) {
        lastRecorded = now;
        recordActivity();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Periodic check every 15 seconds for inactivity timeout or workday completion
    const checkInterval = setInterval(() => {
      if (isSessionExpiredByInactivity()) {
        void logout("inactivity");
      } else if (isSessionExpiredByWorkday()) {
        void logout("workday");
      }
    }, 15_000);

    // Immediate check on focus / visibility change (e.g. waking from sleep or tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (isSessionExpiredByInactivity()) {
          void logout("inactivity");
        } else if (isSessionExpiredByWorkday()) {
          void logout("workday");
        } else {
          handleUserActivity();
        }
      }
    };
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Proactive background session renewal (refresh token) while active
    const refreshInterval = setInterval(() => {
      if (!isSessionExpiredByInactivity() && !isSessionExpiredByWorkday()) {
        sdk.refresh().catch(() => undefined);
      }
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
      clearInterval(refreshInterval);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [me, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const subdomain = currentTenantSubdomain();
    await sdk.login(email, password, subdomain ? { subdomain } : {});
    initSessionTimers();
    setMe(await sdk.me());
  }, []);

  const signup = useCallback(
    async (input: { tenant_name: string; subdomain: string; email: string; password: string; full_name: string }) => {
      await sdk.signup(input);
      initSessionTimers();
      setMe(await sdk.me());
    },
    [],
  );

  const onboarding = useCallback(async (input: OnboardingInput) => {
    const res = await sdk.onboarding(input);
    initSessionTimers();
    setMe(await sdk.me());
    return res;
  }, []);

  const reload = useCallback(async () => {
    setMe(await sdk.me());
  }, []);

  const value = useMemo(
    () => ({ sdk, me, loading, login, signup, onboarding, logout, reload }),
    [me, loading, login, signup, onboarding, logout, reload],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
