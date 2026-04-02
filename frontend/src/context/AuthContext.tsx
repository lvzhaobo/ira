import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const LS_KEY = "ira-workshop.auth";

export type AuthUser = { username: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { username?: string };
    if (j?.username && typeof j.username === "string") return { username: j.username };
  } catch {
    /* ignore */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (typeof window !== "undefined" ? readStored() : null));

  const login = useCallback((username: string) => {
    const u = { username };
    sessionStorage.setItem(LS_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(LS_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      username: user?.username ?? null,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
