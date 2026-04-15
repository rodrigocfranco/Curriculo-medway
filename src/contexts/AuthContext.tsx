import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

  // Ref ao mutation evita que `signOut` (e por consequência o `value` do context)
  // mude de identidade a cada render — `useLogout()` retorna objeto novo a cada render.
  const logoutMutationRef = useRef(logoutMutation);
  logoutMutationRef.current = logoutMutation;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const clearAuthState = () => {
      setSession(null);
      setUser(null);
      setRecoveryMode(false);
      queryClient.removeQueries({ queryKey: ["profile"] });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setSessionLoading(false);
      })
      .catch((error) => {
        // Falha de leitura da sessão (rede, storage corrompido) — não trava o app.
        if (!mounted) return;
        console.error("AuthProvider getSession error", error);
        setSession(null);
        setUser(null);
        setSessionLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      // Se o SDK emitir um evento de "novo estado" sem sessão (refresh-token
      // revogado, etc.), tratar como SIGNED_OUT completo (limpar profile cache).
      if (
        !nextSession &&
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        clearAuthState();
        setSessionLoading(false);
        return;
      }

      switch (event) {
        case "PASSWORD_RECOVERY":
          // Sessão temporária de recovery — permite updateUser(), mas páginas
          // autenticadas devem redirecionar para /reset-password.
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setRecoveryMode(true);
          setSessionLoading(false);
          return;
        case "SIGNED_OUT":
          clearAuthState();
          setSessionLoading(false);
          return;
        case "SIGNED_IN":
        case "USER_UPDATED":
          // SIGNED_IN: login novo. USER_UPDATED: emitido após updateUser()
          // (ex.: troca de senha durante recovery — fluxo está completo).
          // Ambos saem do estado de recovery.
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setRecoveryMode(false);
          setSessionLoading(false);
          return;
        case "TOKEN_REFRESHED":
          // Auto-refresh em background — NÃO mexe em recoveryMode (caso
          // contrário a sessão de recovery expirava o gate ~60min depois).
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setSessionLoading(false);
          return;
        default:
          // INITIAL_SESSION e quaisquer outros — apenas sincroniza estado +
          // sinaliza que a inicialização terminou.
          setSession(nextSession ?? null);
          setUser(nextSession?.user ?? null);
          setSessionLoading(false);
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
    await logoutMutationRef.current.mutateAsync();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, recoveryMode, signOut }),
    [user, session, profile, loading, recoveryMode, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
