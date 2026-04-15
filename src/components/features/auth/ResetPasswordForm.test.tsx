import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateUserMock = vi.fn();
const signOutMock = vi.fn();
const navigateMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => updateUserMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { ResetPasswordForm } from "./ResetPasswordForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ResetPasswordForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  updateUserMock.mockReset();
  signOutMock.mockReset().mockResolvedValue({ error: null });
  navigateMock.mockReset();
  toastErrorMock.mockReset();
  toastSuccessMock.mockReset();
});

describe("ResetPasswordForm — render (AC2)", () => {
  it("renderiza 2 inputs password + hint + CTA verbatim", () => {
    renderForm();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
    expect(screen.getByText("Mínimo 8 caracteres.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Alterar senha" }),
    ).toBeInTheDocument();
  });
});

describe("ResetPasswordForm — validação inline (AC2)", () => {
  it("senhas diferentes → FormMessage âmbar em confirmPassword; não chama updateUser", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "outra" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    const msg = await screen.findByText("Senhas não conferem");
    expect(msg.className).toContain("text-warning");
    expect(msg.className).not.toMatch(/text-destructive|text-red-/);
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("senha <8 chars → FormMessage em password; não chama updateUser", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "1234567" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    const msg = await screen.findByText("Mínimo 8 caracteres");
    expect(msg.className).toContain("text-warning");
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordForm — submit (AC2)", () => {
  it("sucesso → updateUser + signOut(local) + toast + navigate('/login', replace)", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "novaSenha1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "novaSenha1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: "novaSenha1" });
    });
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    });
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Senha alterada com sucesso. Entre com a nova senha.",
      );
    });
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("erro same_password → FormMessage inline em password (não toast)", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "same",
        name: "AuthApiError",
        code: "same_password",
      },
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await screen.findByText("A nova senha deve ser diferente da anterior");
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("erro Auth session missing → toast + navigate /forgot-password", async () => {
    updateUserMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Auth session missing!",
        name: "AuthSessionMissingError",
      },
    });

    renderForm();
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "senhaForte1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Link inválido ou expirado. Solicite um novo.",
      );
    });
    expect(navigateMock).toHaveBeenCalledWith("/forgot-password", {
      replace: true,
    });
  });
});
