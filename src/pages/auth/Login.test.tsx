import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/components/features/auth/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import Login from "./Login";

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReset();
});

describe("Login page", () => {
  it("renderiza LoginForm para user anônimo", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      session: null,
      signOut: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redireciona user autenticado student para /app", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "l@x.com" },
      profile: { role: "student" },
      loading: false,
      session: { access_token: "t" },
      signOut: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
  });

  it("redireciona user autenticado admin para /admin", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u2", email: "a@x.com" },
      profile: { role: "admin" },
      loading: false,
      session: { access_token: "t" },
      signOut: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(navigateMock).toHaveBeenCalledWith("/admin", { replace: true });
  });
});
