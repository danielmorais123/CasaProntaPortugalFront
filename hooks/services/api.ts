import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://c15gz92t-5284.uks1.devtunnels.ms/api";
// 10.0.2.2 = Android Emulator → muda se necessário

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Automatically refresh token when 401 occurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) return Promise.reject(error);

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccess = res.data.accessToken;
        const newRefresh = res.data.refreshToken;

        await SecureStore.setItemAsync("token", newAccess);
        await SecureStore.setItemAsync("refreshToken", newRefresh);

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        original.headers["Authorization"] = `Bearer ${newAccess}`;

        return api(original);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
