import { useEffect, useRef, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "student" | "admin";

interface ProtectedRouteProps {
  role: Role | Role[];
  children?: ReactNode;
}

const LoadingSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Skeleton className="h-12 w-64" />
  </div>
);

export const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const { user, profile, loading, recoveryMode } = useAuth();
  const location = useLocation();
  const toastedRef = useRef(false);

  const allowedRoles = Array.isArray(role) ? role : [role];
  const roleMismatch =
    !!user && !!profile && !allowedRoles.includes(profile.role as Role);

  useEffect(() => {
    if (roleMismatch && !toastedRef.current) {
      toastedRef.current = true;
      toast.error("Acesso restrito");
    }
  }, [roleMismatch]);

  if (loading) return <LoadingSkeleton />;
  if (recoveryMode) return <Navigate to="/reset-password" replace />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!profile) return <LoadingSkeleton />;
  if (roleMismatch) {
    const fallback = profile.role === "admin" ? "/admin" : "/app";
    return <Navigate to={fallback} replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
