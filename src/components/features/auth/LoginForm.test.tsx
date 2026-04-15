import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

const signInMock = vi.fn();
const navigateMock = vi.fn();
const toastErrorMock = vi.fn();
const singleMock = vi.fn();
const eqMock = vi.fn(() => ({ single: singleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInMock(...args),
    },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { LoginForm } from "./LoginForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  signInMock.mockReset();
  navigateMock.mockReset();
  toastErrorMock.mockReset();
  singleMock.mockReset();
  eqMock.mockClear();
  selectMock.mockClear();
  fromMock.mockClear();
});

describe("LoginForm — render (AC1)", () => {
  it("renderiza email + senha + CTA + links secundários", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Esqueci minha senha" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar conta" })).toBeInTheDocument();
  });
});

describe("LoginForm — validação inline (AC1)", () => {
  it("não chama signInWithPassword com email inválido e mostra FormMessage âmbar", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "xxx" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const msg = await screen.findByText("Email inválido");
    expect(msg).toBeInTheDocument();
    expect(msg.className).toContain("text-warning");
    expect(msg.className).not.toMatch(/text-destructive|text-red-/);
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("LoginForm — submit (AC1)", () => {
  it("sucesso student → navigate('/app')", async () => {
    signInMock.mockResolvedValueOnce({
      data: {
        user: { id: "u1", email: "lucas@example.com" },
        session: { access_token: "tok", refresh_token: "ref" },
      },
      error: null,
    });
    singleMock.mockResolvedValueOnce({
      data: { role: "student" },
      error: null,
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "lucas@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "lucas@example.com",
        password: "senhaForte1",
      });
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("sucesso admin → navigate('/admin')", async () => {
    signInMock.mockResolvedValueOnce({
      data: {
        user: { id: "u2", email: "admin@example.com" },
        session: { access_token: "tok", refresh_token: "ref" },
      },
      error: null,
    });
    singleMock.mockResolvedValueOnce({
      data: { role: "admin" },
      error: null,
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/admin", { replace: true });
    });
  });

  it("invalid_credentials → toast verbatim + limpa senha + foco em senha", async () => {
    signInMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", name: "AuthApiError" },
    });

    renderForm();
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const passInput = screen.getByLabelText("Senha") as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "lucas@example.com" } });
    fireEvent.change(passInput, { target: { value: "errada" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Email ou senha inválidos");
    });
    await waitFor(() => {
      expect(passInput.value).toBe("");
    });
    expect(document.activeElement).toBe(passInput);
  });
});
