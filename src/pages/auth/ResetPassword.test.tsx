import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/components/features/auth/ResetPasswordForm", () => ({
  ResetPasswordForm: () => <div data-testid="reset-password-form" />,
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

import ResetPassword from "./ResetPassword";

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReset();
  toastErrorMock.mockReset();
});

describe("ResetPassword page", () => {
  it("loading=true → render 'Carregando…'", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: true,
      recoveryMode: false,
    });
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );
    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("user null + loading false → toast erro + navigate /forgot-password", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      recoveryMode: false,
    });
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Link inválido ou expirado. Solicite um novo.",
    );
    expect(navigateMock).toHaveBeenCalledWith("/forgot-password", {
      replace: true,
    });
  });

  it("user logado sem recoveryMode → gate estrito redireciona /forgot-password", () => {
    // Caminho de troca de senha para user autenticado é AccountSettings (Story 5.2),
    // não /reset-password — gate previne bypass de reautenticação.
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "l@x.com" },
      loading: false,
      recoveryMode: false,
    });
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Link inválido ou expirado. Solicite um novo.",
    );
    expect(navigateMock).toHaveBeenCalledWith("/forgot-password", {
      replace: true,
    });
  });

  it("user presente em recoveryMode → renderiza formulário", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "l@x.com" },
      loading: false,
      recoveryMode: true,
    });
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Definir nova senha" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });
});
