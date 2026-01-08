import axios from "axios";
import { Platform } from "react-native";

// @ts-ignore
const MAC_API_URL =
  process.env.MAC_API_URL ?? "https://3xd74l54-5084.uks1.devtunnels.ms/api";
// @ts-ignore
const WINDOWS_API_URL =
  process.env.WINDOWS_API_URL ?? "https://c15gz92t-5084.uks1.devtunnels.ms/api";

const API_URL = MAC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
console.log("API_URL:", API_URL);
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
