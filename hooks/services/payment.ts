import { api } from "./api";

export const openBillingPortal = async (userEmail: string) => {
  const res = await api.post("/payments/billing-portal", userEmail, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data.url;
};
