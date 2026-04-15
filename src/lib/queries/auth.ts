import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import type { Database } from "../database.types";
import type { SignupFormValues } from "../schemas/signup";
import type { LoginFormValues } from "../schemas/login";
import type { ResetPasswordFormValues } from "../schemas/reset-password";

export type SignupErrorField = keyof SignupFormValues | null;

export class SignupError extends Error {
  field: SignupErrorField;
  constructor(message: string, field: SignupErrorField = null) {
    super(message);
    this.name = "SignupError";
    this.field = field;
  }
}

function hasCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === code
  );
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // fetch failed / CORS
  if (typeof error !== "object" || error === null) return false;
  const name = (error as { name?: unknown }).name;
  if (name === "AbortError" || name === "NetworkError") return true;
  const message = (error as { message?: unknown }).message;
  if (typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("load failed") ||
    lower.includes("timeout")
  );
}

export function mapSignupError(error: AuthError | Error): SignupError {
  if (isNetworkError(error)) {
    return new SignupError(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
      null,
    );
  }
  const message = error.message ?? "";
  // Prefer error.code over message (resilient to Supabase upstream string changes).
  if (
    hasCode(error, "user_already_exists") ||
    hasCode(error, "email_exists") ||
    message.includes("User already registered")
  ) {
    return new SignupError(
      "Este email já está cadastrado — faça login",
      "email",
    );
  }
  if (hasCode(error, "weak_password")) {
    return new SignupError(
      "Senha muito fraca — use uma senha mais forte",
      "password",
    );
  }
  if (
    hasCode(error, "password_too_short") ||
    message.includes("Password should be at least")
  ) {
    return new SignupError(
      "Senha muito curta (mínimo 8 caracteres)",
      "password",
    );
  }
  if (
    hasCode(error, "over_request_rate_limit") ||
    hasCode(error, "over_email_send_rate_limit") ||
    message.toLowerCase().includes("rate limit")
  ) {
    return new SignupError(
      "Muitas tentativas — aguarde alguns minutos",
      null,
    );
  }
  return new SignupError(
    "Não foi possível cadastrar agora. Tente novamente.",
    null,
  );
}

export function useSignup(): UseMutationResult<
  { user: User },
  SignupError,
  SignupFormValues
> {
  return useMutation<{ user: User }, SignupError, SignupFormValues>({
    mutationFn: async (values) => {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            phone: values.phone,
            state: values.state,
            university: values.university,
            graduation_year: values.graduation_year,
            specialty_interest: values.specialty_interest,
            // LGPD audit trail: persistido em auth.users.raw_user_meta_data.
            // Migration futura pode promover para colunas em profiles.
            lgpd_accepted_at: new Date().toISOString(),
            lgpd_version: LGPD_TERMS_VERSION,
          },
        },
      });
      if (error) throw mapSignupError(error);
      if (!data.user) throw new SignupError("Falha inesperada no cadastro");
      return { user: data.user };
    },
  });
}

// Versão do termo LGPD apresentado no formulário. Bump quando o texto mudar
// para preservar rastro de auditoria (qual versão cada usuário aceitou).
export const LGPD_TERMS_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Story 1.6 — Login / Logout / Current profile
// ---------------------------------------------------------------------------

export type LoginErrorField = keyof LoginFormValues | null;

export class LoginError extends Error {
  field: LoginErrorField;
  constructor(message: string, field: LoginErrorField = null) {
    super(message);
    this.name = "LoginError";
    this.field = field;
  }
}

export function mapLoginError(error: AuthError | Error): LoginError {
  const message = error.message ?? "";
  if (
    hasCode(error, "invalid_credentials") ||
    message.includes("Invalid login credentials")
  ) {
    // AC1 verbatim — nunca revelar "email não encontrado" vs "senha errada"
    // (proteção contra enumeração de email).
    return new LoginError("Email ou senha inválidos");
  }
  if (
    hasCode(error, "email_not_confirmed") ||
    message.includes("Email not confirmed")
  ) {
    return new LoginError("Confirme seu email antes de entrar");
  }
  if (
    hasCode(error, "over_request_rate_limit") ||
    message.toLowerCase().includes("rate limit")
  ) {
    return new LoginError("Muitas tentativas — aguarde alguns minutos");
  }
  return new LoginError("Não foi possível entrar agora. Tente novamente.");
}

export function useLogin(): UseMutationResult<
  { user: User; session: Session },
  LoginError,
  LoginFormValues
> {
  return useMutation<
    { user: User; session: Session },
    LoginError,
    LoginFormValues
  >({
    mutationFn: async (values) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw mapLoginError(error);
      if (!data.user || !data.session) {
        throw new LoginError("Sessão não retornada pelo servidor.");
      }
      return { user: data.user, session: data.session };
    },
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        // Não bloqueante: SDK limpa sessão local mesmo com 401 no revoke.
        console.error("signOut revoke error", error);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Story 1.7 — Password reset (forgot / reset)
// ---------------------------------------------------------------------------

export type ResetPasswordErrorField = "password" | "confirmPassword" | null;

export class ResetPasswordError extends Error {
  field: ResetPasswordErrorField;
  constructor(message: string, field: ResetPasswordErrorField = null) {
    super(message);
    this.name = "ResetPasswordError";
    this.field = field;
  }
}

export function mapResetPasswordError(
  error: AuthError | Error,
): ResetPasswordError {
  if (isNetworkError(error)) {
    return new ResetPasswordError(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
    );
  }
  const message = error.message ?? "";
  if (
    hasCode(error, "same_password") ||
    message.includes("New password should be different from the old password")
  ) {
    return new ResetPasswordError(
      "A nova senha deve ser diferente da anterior",
      "password",
    );
  }
  if (
    hasCode(error, "weak_password") ||
    message.includes("Password should be at least")
  ) {
    return new ResetPasswordError(
      "Senha muito fraca — mínimo 8 caracteres",
      "password",
    );
  }
  if (
    hasCode(error, "over_request_rate_limit") ||
    message.toLowerCase().includes("rate limit")
  ) {
    return new ResetPasswordError(
      "Muitas tentativas — aguarde alguns minutos",
    );
  }
  if (message.includes("Auth session missing")) {
    return new ResetPasswordError(
      "Link inválido ou expirado. Solicite um novo.",
    );
  }
  return new ResetPasswordError(
    "Não foi possível alterar a senha agora. Tente novamente.",
  );
}

export type RequestPasswordResetErrorKind = "rate_limit" | "network" | "unknown";

export class RequestPasswordResetError extends Error {
  kind: RequestPasswordResetErrorKind;
  constructor(message: string, kind: RequestPasswordResetErrorKind) {
    super(message);
    this.name = "RequestPasswordResetError";
    this.kind = kind;
  }
}

// Defense-in-depth: Supabase 2.x default já retorna { error: null } para email
// inexistente, mas neutralizamos caso uma futura versão escape essa mensagem ou
// emita variantes (email_address_invalid para domínios rejeitados, validation_failed
// em lookups server-side). Evita oráculo de enumeração via toast genérico.
function isNeutralizableError(error: AuthError | Error): boolean {
  const message = error.message ?? "";
  return (
    hasCode(error, "user_not_found") ||
    hasCode(error, "email_address_invalid") ||
    hasCode(error, "validation_failed") ||
    message.includes("User not found") ||
    message.includes("Email address") // cobre "Email address ... is invalid"
  );
}

function mapRequestPasswordResetError(
  error: AuthError | Error,
): RequestPasswordResetError {
  if (isNetworkError(error)) {
    return new RequestPasswordResetError(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
      "network",
    );
  }
  const message = error.message ?? "";
  if (
    hasCode(error, "over_request_rate_limit") ||
    hasCode(error, "over_email_send_rate_limit") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("for security purposes")
  ) {
    return new RequestPasswordResetError(
      "Muitas tentativas — aguarde alguns minutos",
      "rate_limit",
    );
  }
  return new RequestPasswordResetError(
    "Não foi possível enviar agora. Tente novamente.",
    "unknown",
  );
}

export function useRequestPasswordReset(): UseMutationResult<
  void,
  RequestPasswordResetError,
  { email: string }
> {
  return useMutation<void, RequestPasswordResetError, { email: string }>({
    mutationFn: async ({ email }) => {
      const redirectTo = `${window.location.origin}/reset-password`;
      let result: Awaited<
        ReturnType<typeof supabase.auth.resetPasswordForEmail>
      >;
      try {
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
      } catch (thrown) {
        // fetch failure / TypeError / AbortError — classifica antes de propagar.
        throw mapRequestPasswordResetError(thrown as Error);
      }
      const { error } = result;
      if (error && !isNeutralizableError(error)) {
        throw mapRequestPasswordResetError(error);
      }
    },
  });
}

export function useResetPassword(): UseMutationResult<
  void,
  ResetPasswordError,
  ResetPasswordFormValues
> {
  return useMutation<void, ResetPasswordError, ResetPasswordFormValues>({
    mutationFn: async (values) => {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) throw mapResetPasswordError(error);
      // AuthContext reage via onAuthStateChange("USER_UPDATED"); não tocar aqui.
    },
  });
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function useCurrentProfile(
  userId: string | null,
): UseQueryResult<ProfileRow | null, Error> {
  return useQuery<ProfileRow | null, Error>({
    queryKey: ["profile", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
