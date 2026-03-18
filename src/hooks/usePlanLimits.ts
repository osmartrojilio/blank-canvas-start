import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export type PlanType = "trial" | "free" | "paid";

export interface PlanLimits {
  planType: PlanType;
  planSlug: string | null;
  maxVehicles: number | null; // null = unlimited
  maxUsers: number | null; // null = unlimited
  canExport: boolean;
  canAccessAdvancedReports: boolean;
  isFreePlan: boolean;
  isTrialing: boolean;
  isPaid: boolean;
  trialDaysLeft: number | null;
}

const FREE_LIMITS: Omit<PlanLimits, "planType" | "planSlug" | "trialDaysLeft"> = {
  maxVehicles: 1,
  maxUsers: 1,
  canExport: false,
  canAccessAdvancedReports: false,
  isFreePlan: true,
  isTrialing: false,
  isPaid: false,
};

export function usePlanLimits(): PlanLimits {
  const { organization } = useAuth();

  return useMemo(() => {
    if (!organization) {
      return {
        planType: "free",
        planSlug: null,
        trialDaysLeft: null,
        ...FREE_LIMITS,
      };
    }

    const status = organization.subscription_status;
    const planId = organization.plan_id;

    // Active paid plan
    if (status === "active" && planId) {
      return {
        planType: "paid",
        planSlug: null, // slug not available from org, but plan_id is set
        maxVehicles: null, // paid plans use DB limits from subscription_plans
        maxUsers: null,
        canExport: true,
        canAccessAdvancedReports: true,
        isFreePlan: false,
        isTrialing: false,
        isPaid: true,
        trialDaysLeft: null,
      };
    }

    // Trialing - check if trial is still valid
    if (status === "trialing" && organization.trial_ends_at) {
      const trialEnd = new Date(organization.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft > 0) {
        // Active trial - full access
        return {
          planType: "trial",
          planSlug: "trial",
          maxVehicles: null,
          maxUsers: null,
          canExport: true,
          canAccessAdvancedReports: true,
          isFreePlan: false,
          isTrialing: true,
          isPaid: false,
          trialDaysLeft: daysLeft,
        };
      }
    }

    // Trial expired or no paid plan → Free plan
    return {
      planType: "free",
      planSlug: "free",
      trialDaysLeft: 0,
      ...FREE_LIMITS,
    };
  }, [organization]);
}
