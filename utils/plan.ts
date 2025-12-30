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

/**
 * Returns the max file size in bytes for a given plan code.
 * If not found, defaults to 2MB (free plan).
 */
export function getMaxFileSizeForPlan(
  planCode: string,
  plans: SubscriptionPlanDto[]
): number {
  const plan = plans.find(
    (p) => p.code.toLowerCase() === planCode.toLowerCase()
  );
  // Default to 2MB if not found (free plan)
  const maxMb = plan?.limits?.maxUploadMb ?? 2;
  return maxMb;
}
