import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import {
  useCurrentProfile,
  useLogout,
  type ProfileRow,
} from "@/lib/queries/auth";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  recoveryMode: boolean;
  signOut: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      switch (event) {
        case "PASSWORD_RECOVERY":
          // Sessão temporária de recovery — permite updateUser(), mas páginas
          // autenticadas devem redirecionar para /reset-password.
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setRecoveryMode(true);
          return;
        case "SIGNED_OUT":
          setSession(null);
          setUser(null);
          setRecoveryMode(false);
          queryClient.removeQueries({ queryKey: ["profile"] });
          return;
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setRecoveryMode(false);
          return;
        default:
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const profileQuery = useCurrentProfile(user?.id ?? null);
  const profile = profileQuery.data ?? null;
  const loading = sessionLoading || (!!user && profileQuery.isLoading);

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, recoveryMode, signOut }),
    [user, session, profile, loading, recoveryMode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
