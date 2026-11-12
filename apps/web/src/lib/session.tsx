import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DentistesClient, type MeResponse, type OnboardingInput, type OnboardingResponse } from "@dentistes/sdk";
import { currentTenantSubdomain } from "./tenant";

interface SessionValue {
  sdk: DentistesClient;
  me: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { tenant_name: string; subdomain: string; email: string; password: string; full_name: string }) => Promise<void>;
  onboarding: (input: OnboardingInput) => Promise<OnboardingResponse>;
  logout: () => Promise<void>;
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

  useEffect(() => {
    let active = true;
    sdk.bootstrap().then((value) => {
      if (active) {
        setMe(value);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const subdomain = currentTenantSubdomain();
    await sdk.login(email, password, subdomain ? { subdomain } : {});
    setMe(await sdk.me());
  }, []);

  const signup = useCallback(
    async (input: { tenant_name: string; subdomain: string; email: string; password: string; full_name: string }) => {
      await sdk.signup(input);
      setMe(await sdk.me());
    },
    [],
  );

  const onboarding = useCallback(async (input: OnboardingInput) => {
    const res = await sdk.onboarding(input);
    setMe(await sdk.me());
    return res;
  }, []);

  const logout = useCallback(async () => {
    await sdk.logout();
    setMe(null);
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
