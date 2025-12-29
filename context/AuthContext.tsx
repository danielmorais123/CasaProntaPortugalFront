import { api } from "@/hooks/services/api";
import {
  login as loginAPI,
  profileUserLoggedIn,
  register as registerAPI,
} from "@/hooks/services/auth";
import React, { createContext, useEffect, useState } from "react";
import type { User } from "@/types/models";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user info on startup
  useEffect(() => {
    (async () => {
      try {
        const res = await profileUserLoggedIn();
        setUser(res);
      } catch {
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);
  const login = async (email: string, password: string) => {
    try {
      const res = await loginAPI(email, password);
      setUser(res.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      await registerAPI(name, email, password, confirmPassword);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
