import { useEffect, useRef, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "student" | "admin";

interface ProtectedRouteProps {
  role: Role;
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
  const roleMismatch = !!user && !!profile && profile.role !== role;

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
  if (roleMismatch) return <Navigate to="/app" replace />;

  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
