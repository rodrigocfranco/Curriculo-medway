import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const resolvePostLoginRouteMock =
  vi.fn<(...args: unknown[]) => Promise<string>>();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/components/features/auth/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

vi.mock("@/lib/post-login-redirect", () => ({
  resolvePostLoginRoute: (...args: unknown[]) =>
    resolvePostLoginRouteMock(...args),
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
  resolvePostLoginRouteMock.mockReset();
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

  it("redireciona user student com currículo preenchido para /app", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "l@x.com" },
      profile: { role: "student" },
      loading: false,
      session: { access_token: "t" },
      signOut: vi.fn(),
    });
    resolvePostLoginRouteMock.mockResolvedValueOnce("/app");
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(resolvePostLoginRouteMock).toHaveBeenCalledWith("u1", "student");
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app", { replace: true });
    });
  });

  it("redireciona user student sem currículo para /app/curriculo", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u3", email: "novo@x.com" },
      profile: { role: "student" },
      loading: false,
      session: { access_token: "t" },
      signOut: vi.fn(),
    });
    resolvePostLoginRouteMock.mockResolvedValueOnce("/app/curriculo");
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/app/curriculo", {
        replace: true,
      });
    });
  });

  it("redireciona user autenticado admin para /admin", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u2", email: "a@x.com" },
      profile: { role: "admin" },
      loading: false,
      session: { access_token: "t" },
      signOut: vi.fn(),
    });
    resolvePostLoginRouteMock.mockResolvedValueOnce("/admin");
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/admin", { replace: true });
    });
  });
});
