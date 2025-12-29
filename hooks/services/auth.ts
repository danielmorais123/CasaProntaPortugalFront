import { api } from "./api";

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) => {
  console.log({ confirmPassword });
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
    confirmPassword,
  });
  return response.data;
};
export const me = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const profileUserLoggedIn = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};
