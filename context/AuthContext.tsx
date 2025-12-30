import { api } from "@/hooks/services/api";
import {
  login as loginAPI,
  profileUserLoggedIn,
  register as registerAPI,
} from "@/hooks/services/auth";
import React, { createContext } from "react";
import type { User } from "@/types/models";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const [user, setUser] = React.useState<User | null>(null);
  const queryClient = useQueryClient();

  // Query para buscar o utilizador autenticado
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user"],
    queryFn: profileUserLoggedIn,
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => setUser(data),
    onError: () => setUser(null),
  });

  React.useEffect(() => {
    if (data) setUser(data);
  }, [data]);

  const login = async (email: string, password: string) => {
    try {
      const res = await loginAPI(email, password);
      setUser(res.user);
      // Atualiza o cache do user
      queryClient.setQueryData(["user"], res.user);
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
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {}
    setUser(null);
    queryClient.removeQueries({ queryKey: ["user"] });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading: isLoading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
