import { api } from "./api";

export const openBillingPortal = async (userEmail: string) => {
  const res = await api.post("/payments/billing-portal", userEmail, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data.url;
};

export const createCheckoutOrPortalSession = async (
  userEmail: string,
  planCode?: string
): Promise<{ url: string; portal: boolean }> => {
  const res = await api.post(
    "/payments/create-checkout-session",
    { userEmail, planCode },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data;
};
