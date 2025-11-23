import { api } from "@/hooks/services/api";
import {
  login as loginAPI,
  register as registerAPI,
} from "@/hooks/services/auth";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useState } from "react";

interface AuthContextProps {
  user: string | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  token: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on startup
  useEffect(() => {
    (async () => {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("email");
      if (savedToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
        setToken(savedToken);
      }
      if (savedUser) setUser(savedUser);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with", email, password);
      const res = await loginAPI(email, password);
      console.log("teste", res);
      await SecureStore.setItemAsync("token", res.accessToken);
      await SecureStore.setItemAsync("refreshToken", res.refreshToken);
      await SecureStore.setItemAsync("email", email);

      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.accessToken}`;

      setToken(res.accessToken);
      setUser(email);

      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await registerAPI(email, password);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("email");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
