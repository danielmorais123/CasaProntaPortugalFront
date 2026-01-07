import { api } from "@/hooks/services/api";
import {
  login as loginAPI,
  profileUserLoggedIn,
  register as registerAPI,
} from "@/hooks/services/auth";
import React, { createContext, useState } from "react";
import type { User } from "@/types/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerDevice } from "@/hooks/services/device";

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
  devicePending: boolean;
  pendingPushToken: string | null;
  setDevicePending: (pending: boolean) => void;
  setPendingPushToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  devicePending: false,
  pendingPushToken: null,
  setDevicePending: () => {},
  setPendingPushToken: () => {},
});

export const AuthProvider = ({ children }: any) => {
  const queryClient = useQueryClient();
  const [devicePending, setDevicePending] = useState(false);
  const [pendingPushToken, setPendingPushToken] = useState<string | null>(null);
  // Query para buscar o utilizador autenticado
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: profileUserLoggedIn,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const login = async (email: string, password: string) => {
    try {
      const res = await loginAPI(email, password);
      queryClient.setQueryData(["user"], res.user);

      let pushToken = "";
      try {
        pushToken = (await Notifications.getExpoPushTokenAsync()).data;
        const deviceRes = await registerDevice(pushToken, Platform.OS);
        console.log("Device registration response:", deviceRes);
        if (deviceRes.requiresConfirmation) {
          setDevicePending(true);
          setPendingPushToken(pushToken);
          return false; // block app usage until confirmed
        }
      } catch (e) {
        console.warn("Falha ao registar dispositivo:", e);
      }

      setDevicePending(false);
      setPendingPushToken(null);
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
      // Opcional: refetch user
      await refetch();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      const res = await api.post("/auth/logout", {}, { withCredentials: true });

      queryClient.setQueryData(["user"], null);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        login,
        logout,
        register,
        devicePending,
        pendingPushToken,
        setDevicePending,
        setPendingPushToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
