import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";
import {
  useSignup,
  mapSignupError,
  SignupError,
  useLogin,
  useLogout,
  useCurrentProfile,
  mapLoginError,
  LoginError,
  useRequestPasswordReset,
  useResetPassword,
  mapResetPasswordError,
  ResetPasswordError,
} from "./auth";
import type { SignupFormValues } from "../schemas/signup";
import type { LoginFormValues } from "../schemas/login";

const signUpMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const updateUserMock = vi.fn();
const singleMock = vi.fn();
const eqMock = vi.fn(() => ({ single: singleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      signInWithPassword: (...args: unknown[]) => signInMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      resetPasswordForEmail: (...args: unknown[]) =>
        resetPasswordForEmailMock(...args),
      updateUser: (...args: unknown[]) => updateUserMock(...args),
    },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

const signupValues: SignupFormValues = {
  name: "Lucas Medway",
  email: "lucas@example.com",
  phone: "(11) 98765-4321",
  state: "SP",
  university: "USP-SP",
  graduation_year: 2028,
  specialty_interest: "Clínica Médica",
  password: "senhaForte1",
  confirmPassword: "senhaForte1",
  lgpd_accepted: true,
};

const loginValues: LoginFormValues = {
  email: "lucas@example.com",
  password: "senhaForte1",
};

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

beforeEach(() => {
  signUpMock.mockReset();
  signInMock.mockReset();
  signOutMock.mockReset();
  resetPasswordForEmailMock.mockReset();
  updateUserMock.mockReset();
  singleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
});

describe("useSignup mutation", () => {
  it("envia metadados em snake_case em options.data e retorna user", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: { id: "u1", email: signupValues.email } },
      error: null,
    });

    const { result } = renderHook(() => useSignup(), { wrapper: makeWrapper() });
    result.current.mutate(signupValues);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(signUpMock).toHaveBeenCalledTimes(1);
    const call = signUpMock.mock.calls[0][0];
    expect(call.email).toBe(signupValues.email);
    expect(call.password).toBe(signupValues.password);
    expect(call.options.data).toMatchObject({
      name: signupValues.name,
      phone: signupValues.phone,
      state: signupValues.state,
      university: signupValues.university,
      graduation_year: signupValues.graduation_year,
      specialty_interest: signupValues.specialty_interest,
    });
    // LGPD audit trail (ver Decision D3).
    expect(call.options.data.lgpd_accepted_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    expect(call.options.data.lgpd_version).toBe("1.0");
    expect(result.current.data?.user.id).toBe("u1");
  });

  it("mapeia duplicate email para mensagem AC4 verbatim", async () => {
    signUpMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered", name: "AuthApiError" },
    });

    const { result } = renderHook(() => useSignup(), { wrapper: makeWrapper() });
    result.current.mutate(signupValues);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(SignupError);
    expect(result.current.error?.field).toBe("email");
    expect(result.current.error?.message).toBe(
      "Este email já está cadastrado — faça login",
    );
  });

  it("mapeia weak_password code para pt-BR", () => {
    const err = mapSignupError({
      message: "weak",
      name: "AuthApiError",
      code: "weak_password",
    } as unknown as Error);
    expect(err.field).toBe("password");
    expect(err.message).toContain("fraca");
  });

  it("mapeia rate limit para campo null (toast)", () => {
    const err = mapSignupError({
      message: "rate limit exceeded",
      name: "AuthApiError",
    } as Error);
    expect(err.field).toBeNull();
  });
});

describe("useLogin mutation", () => {
  it("sucesso retorna { user, session }", async () => {
    signInMock.mockResolvedValueOnce({
      data: {
        user: { id: "u1", email: loginValues.email },
        session: { access_token: "tok", refresh_token: "ref" },
      },
      error: null,
    });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    result.current.mutate(loginValues);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(signInMock).toHaveBeenCalledWith({
      email: loginValues.email,
      password: loginValues.password,
    });
    expect(result.current.data?.user.id).toBe("u1");
    expect(result.current.data?.session.access_token).toBe("tok");
  });

  it("mapeia invalid_credentials para mensagem verbatim AC1", async () => {
    signInMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", name: "AuthApiError" },
    });

    const { result } = renderHook(() => useLogin(), { wrapper: makeWrapper() });
    result.current.mutate(loginValues);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(LoginError);
    expect(result.current.error?.message).toBe("Email ou senha inválidos");
  });

  it("mapeia rate limit para mensagem genérica", () => {
    const err = mapLoginError({
      message: "rate limit exceeded",
      name: "AuthApiError",
    } as Error);
    expect(err.message).toContain("Muitas tentativas");
  });

  it("mapeia email_not_confirmed", () => {
    const err = mapLoginError({
      message: "",
      name: "AuthApiError",
      code: "email_not_confirmed",
    } as unknown as Error);
    expect(err.message).toContain("Confirme seu email");
  });

  it("fallback para erro desconhecido", () => {
    const err = mapLoginError({ message: "boom", name: "Err" } as Error);
    expect(err.message).toBe("Não foi possível entrar agora. Tente novamente.");
  });
});

describe("useLogout mutation", () => {
  it("chama supabase.auth.signOut com scope local", async () => {
    signOutMock.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("não bloqueia em erro de revoke (apenas loga)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    signOutMock.mockResolvedValueOnce({
      error: { message: "401", name: "AuthApiError" },
    });

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("useCurrentProfile query", () => {
  it("disabled quando userId é null", async () => {
    const { result } = renderHook(() => useCurrentProfile(null), {
      wrapper: makeWrapper(),
    });
    // enabled=false → isPending mas fetchStatus idle
    expect(result.current.fetchStatus).toBe("idle");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("resolve com row ao dar fetch", async () => {
    const row = {
      id: "u1",
      name: "Lucas",
      email: "lucas@example.com",
      role: "student",
      phone: null,
      state: null,
      university: null,
      graduation_year: null,
      specialty_interest: null,
      created_at: "2026-04-14T00:00:00Z",
      updated_at: "2026-04-14T00:00:00Z",
    };
    singleMock.mockResolvedValueOnce({ data: row, error: null });

    const { result } = renderHook(() => useCurrentProfile("u1"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("id", "u1");
    expect(result.current.data).toEqual(row);
  });

  it("propaga erro do Postgrest", async () => {
    singleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "not found", code: "PGRST116" },
    });

    const { result } = renderHook(() => useCurrentProfile("u-missing"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("not found");
  });
});

describe("useRequestPasswordReset mutation", () => {
  it("chama resetPasswordForEmail com email e redirectTo contendo /reset-password", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useRequestPasswordReset(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ email: "lucas@example.com" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resetPasswordForEmailMock).toHaveBeenCalledTimes(1);
    const [email, opts] = resetPasswordForEmailMock.mock.calls[0];
    expect(email).toBe("lucas@example.com");
    expect(opts.redirectTo).toMatch(/\/reset-password$/);
  });

  it("neutraliza user_not_found (resolve sem throw) para evitar enumeração", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: { message: "User not found", name: "AuthApiError" },
    });

    const { result } = renderHook(() => useRequestPasswordReset(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ email: "missing@example.com" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("mapeia rate limit para RequestPasswordResetError.kind='rate_limit'", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: { message: "rate limit exceeded", name: "AuthApiError" },
    });

    const { result } = renderHook(() => useRequestPasswordReset(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ email: "lucas@example.com" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.kind).toBe("rate_limit");
    expect(result.current.error?.message).toBe(
      "Muitas tentativas — aguarde alguns minutos",
    );
  });

  it("mapeia falha de rede (TypeError) para kind='network'", async () => {
    resetPasswordForEmailMock.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    const { result } = renderHook(() => useRequestPasswordReset(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ email: "lucas@example.com" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.kind).toBe("network");
  });

  it("neutraliza email_address_invalid (defense-in-depth anti-enumeração)", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: {
        code: "email_address_invalid",
        message: "Email address is invalid",
        name: "AuthApiError",
      },
    });

    const { result } = renderHook(() => useRequestPasswordReset(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({ email: "weird@nope" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useResetPassword mutation", () => {
  it("chama updateUser com password e resolve em sucesso", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      password: "novaSenhaForte1",
      confirmPassword: "novaSenhaForte1",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateUserMock).toHaveBeenCalledWith({
      password: "novaSenhaForte1",
    });
  });

  it("mapeia same_password para field password com mensagem verbatim", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: { message: "same", name: "AuthApiError", code: "same_password" },
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: makeWrapper(),
    });
    result.current.mutate({
      password: "senhaForte1",
      confirmPassword: "senhaForte1",
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ResetPasswordError);
    expect(result.current.error?.field).toBe("password");
    expect(result.current.error?.message).toBe(
      "A nova senha deve ser diferente da anterior",
    );
  });

  it("mapeia Auth session missing para field null e mensagem de link expirado", () => {
    const err = mapResetPasswordError({
      message: "Auth session missing!",
      name: "AuthSessionMissingError",
    } as Error);
    expect(err.field).toBeNull();
    expect(err.message).toBe("Link inválido ou expirado. Solicite um novo.");
  });

  it("fallback para erro desconhecido", () => {
    const err = mapResetPasswordError({
      message: "boom",
      name: "Err",
    } as Error);
    expect(err.field).toBeNull();
    expect(err.message).toBe(
      "Não foi possível alterar a senha agora. Tente novamente.",
    );
  });
});
