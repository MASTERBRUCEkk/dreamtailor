export type PlanKey = "starter" | "family" | "premium";

export const PLAN_LIMITS: Record<
  PlanKey,
  { maxChildren: number; maxStoriesPerWeek: number; label: string }
> = {
  starter: { maxChildren: 1, maxStoriesPerWeek: 3, label: "Starter" },
  family: { maxChildren: 3, maxStoriesPerWeek: 999, label: "Family" },
  premium: { maxChildren: 999, maxStoriesPerWeek: 999, label: "Premium" },
};

export function getPlanLimits(plan: string | null | undefined) {
  if (plan && plan in PLAN_LIMITS) return PLAN_LIMITS[plan as PlanKey];
  // Unknown/no plan — treat as the most restrictive case.
  return PLAN_LIMITS.starter;
}
