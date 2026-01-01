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
export async function verifyPassword(
  password: string
): Promise<{ valid: boolean }> {
  const res = await api.post("/auth/verify-password", { password });
  return res.data;
}
export const profileUserLoggedIn = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};
