import { api } from "./api";

export const login = async (email: string, password: string) => {
  console.log("API URL:", api.defaults.baseURL, api);
  const response = await api.post("/auth/login", { email, password });
  console.log({ data: response.data });
  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string
) => {
  const response = await api.post("/auth/register", { name, email, password });
  return response.data;
};
