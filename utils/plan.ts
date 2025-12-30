import type { SubscriptionPlanDto } from "@/types/models";

export function formatPrice(plan?: SubscriptionPlanDto) {
  if (!plan) return "—";
  const monthly = plan.priceMonthly ?? 0;
  const yearly = plan.priceYearly ?? 0;

  if (yearly > 0 && monthly === 0)
    return `${String(yearly).replace(".", ",")}€ / ano`;
  if (monthly === 0) return "Grátis";
  return `${String(monthly).replace(".", ",")}€ / mês`;
}

export function planCodeToId(code?: string) {
  return (code ?? "").toLowerCase();
}
