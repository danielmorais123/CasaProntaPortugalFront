import { SubscriptionPlanDto, Subscription } from "@/types/models";
import { api } from "./api";

export const getPlans = async (): Promise<SubscriptionPlanDto[]> => {
  const res = await api.get("/subscriptions/plans");
  return res.data;
};

export const getPlanByCode = async (
  code: string
): Promise<SubscriptionPlanDto> => {
  const res = await api.get(`/subscriptions/plans/${code}`);
  return res.data;
};

export const getCurrentUserSubscription = async (): Promise<{
  subscription: Subscription;
  plan: SubscriptionPlanDto;
}> => {
  const res = await api.get("/subscriptions/current");
  return res.data as { subscription: Subscription; plan: SubscriptionPlanDto };
};
export const updateUserSubscription = async (planCode: string) => {
  const res = await api.post("/subscriptions/update", { planCode });
  return res.data;
};

export const canUpdateToPlan = async (
  planCode: string
): Promise<{ canUpdate: boolean; errors?: string[] }> => {
  const res = await api.post("/subscriptions/can-update", { planCode });
  return res.data;
};
