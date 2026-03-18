import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "driver";
  requiresPaidPlan?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, requiresPaidPlan }: ProtectedRouteProps) {
  const { user, loading, userRole, needsOnboarding, profile } = useAuth();
  const location = useLocation();
  const { isFreePlan } = usePlanLimits();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if email is verified
  if (profile && !profile.is_email_verified) {
    if (location.pathname !== "/verificar-email") {
      return <Navigate to="/verificar-email" replace />;
    }
  }

  // Check if user needs to complete onboarding (Google OAuth without organization)
  if (needsOnboarding) {
    if (location.pathname !== "/completar-cadastro") {
      return <Navigate to="/completar-cadastro" replace />;
    }
  }

  // Block free plan users from premium routes
  if (requiresPaidPlan && isFreePlan) {
    return <Navigate to="/planos" replace />;
  }

  // Role hierarchy: admin > manager > driver
  if (requiredRole) {
    const roleHierarchy = { admin: 3, manager: 2, driver: 1 };
    const userLevel = userRole ? roleHierarchy[userRole.role] : 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
