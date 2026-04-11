"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getToken, setToken, removeToken } from "@/lib/auth-cookie";
import { getApiBase, ApiError } from "@/lib/api";
import { friendlyError } from "@/lib/errors";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  themeMode: string;
  themePrimary: string;
  themeAccent: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const base = getApiBase();

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as AuthUser;
          setUser(data);
        } else {
          removeToken();
        }
      })
      .catch(() => {
        removeToken();
      })
      .finally(() => setIsLoading(false));
  }, [base]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      let res: Response;
      try {
        res = await fetch(`${base}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (err) {
        throw new Error(friendlyError(err));
      }
      const body = await res.json();
      if (!res.ok) {
        throw new ApiError(body.message ?? friendlyError(new ApiError("", res.status)), res.status, body);
      }
      setToken(body.token);
      setUser(body.user);
      router.push("/home");
    },
    [base, router],
  );

  const register = React.useCallback(
    async (name: string, email: string, password: string) => {
      let res: Response;
      try {
        res = await fetch(`${base}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
      } catch (err) {
        throw new Error(friendlyError(err));
      }
      const body = await res.json();
      if (!res.ok) {
        throw new ApiError(body.message ?? friendlyError(new ApiError("", res.status)), res.status, body);
      }
      setToken(body.token);
      setUser(body.user);
      router.push("/home");
    },
    [base, router],
  );

  const logout = React.useCallback(() => {
    removeToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = React.useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
