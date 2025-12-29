import { api } from "./api";
import { SubscriptionPlanDto } from "@/context/AuthContext"; // or "@/types/models"

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

export const getCurrentUserSubscription =
  async (): Promise<SubscriptionPlanDto> => {
    const res = await api.get("/subscriptions/current");
    return res.data;
  };
