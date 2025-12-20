import axios from "axios";

const API_URL = "https://c15gz92t-5084.uks1.devtunnels.ms/api";
// 10.0.2.2 = Android Emulator → muda se necessário

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

// Automatically refresh token when 401 occurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or clear user state
      console.log("Unauthorized - user needs to login");
    }
    return Promise.reject(error);
  }
);
