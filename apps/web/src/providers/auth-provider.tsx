"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetcher, setTokens, clearTokens, isAuthenticated, getAccessToken } from "@/lib/api";

interface User {
  id: string;
  enterpriseId?: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (email: string) => Promise<{ method: string; options?: any }>;
  loginComplete: (email: string, credential?: any, otp?: string) => Promise<void>;
  register: (email: string) => Promise<void>;
  registerVerify: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      await fetcher("/health", { skipAuth: true });
    } catch {
      clearTokens();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Restore demo session from localStorage
    const demoUser = localStorage.getItem("yn_demo_user");
    if (demoUser) {
      try {
        setUser(JSON.parse(demoUser));
        setIsDemo(true);
        setIsLoading(false);
        return;
      } catch {}
    }

    if (isAuthenticated()) {
      refreshSession();
    } else {
      setIsLoading(false);
    }
  }, [refreshSession]);

  const demoLogin = () => {
    const demoUser: User = {
      id: "demo-enterprise-001",
      enterpriseId: "demo-enterprise-001",
      email: "admin@acmecorp.com",
      role: "admin",
    };
    const demoTokens = {
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
    };
    setTokens(demoTokens.accessToken, demoTokens.refreshToken);
    localStorage.setItem("yn_demo_user", JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemo(true);
    setIsLoading(false);
  };

  const login = async (email: string) => {
    const res = await fetcher<{ success: boolean; data: any }>("/v1/auth/login/begin", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
    if (!res.success) throw new Error((res as any).error?.message || "Login failed");
    return res.data;
  };

  const loginComplete = async (email: string, credential?: any, otp?: string) => {
    const body: any = { email };
    if (credential) body.credential = credential;
    if (otp) body.otp = otp;

    const res = await fetcher<{ success: boolean; data: any }>("/v1/auth/login/complete", {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
    if (!res.success) throw new Error((res as any).error?.message || "Login failed");

    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser({ id: "pending", email, role: "admin" });
  };

  const register = async (email: string) => {
    const res = await fetcher<{ success: boolean; data: any }>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
    if (!res.success) throw new Error((res as any).error?.message || "Registration failed");
  };

  const registerVerify = async (email: string, otp: string) => {
    const res = await fetcher<{ success: boolean; data: any }>("/v1/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
      skipAuth: true,
    });
    if (!res.success) throw new Error((res as any).error?.message || "Verification failed");
  };

  const logout = async () => {
    try {
      await fetcher("/v1/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors
    }
    clearTokens();
    localStorage.removeItem("yn_demo_user");
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user || isAuthenticated(),
        isDemo,
        login,
        loginComplete,
        register,
        registerVerify,
        logout,
        refreshSession,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
