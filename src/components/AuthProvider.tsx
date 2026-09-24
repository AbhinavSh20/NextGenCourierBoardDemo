"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Role = "guest" | "seeker" | "employer";

type AuthState = {
  role: Role;
  name: string;
  ready: boolean;
  signIn: (role: Role, name: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "courier-board-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("guest");
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { role: Role; name: string };
        setRole(parsed.role);
        setName(parsed.name);
      }
    } catch {
      // ponytail: dummy demo auth, ignore storage errors
    }
    setReady(true);
  }, []);

  function signIn(nextRole: Role, nextName: string) {
    setRole(nextRole);
    setName(nextName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: nextRole, name: nextName }));
  }

  function signOut() {
    setRole("guest");
    setName("");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ role, name, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
