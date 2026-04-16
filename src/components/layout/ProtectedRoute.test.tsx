import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useAuthMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}));

import ProtectedRoute from "./ProtectedRoute";

beforeEach(() => {
  useAuthMock.mockReset();
  toastErrorMock.mockReset();
});

const LoginEcho = () => {
  const { search } = useLocation();
  return <div data-testid="login-echo">LoginPage:{search}</div>;
};

// Rota única `/guarded` sob ProtectedRoute; /login, /reset-password e /app
// ficam fora do guard como alvos de Navigate.
function renderAt(initialEntry: string, role: "student" | "admin") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute role={role} />}>
          <Route path="/guarded/*" element={<div>GuardedContent</div>} />
        </Route>
        <Route path="/app" element={<div>AppRedirectTarget</div>} />
        <Route path="/login" element={<LoginEcho />} />
        <Route path="/reset-password" element={<div>ResetPage</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Setup dedicado para validação literal de `?redirect=` (spec Task 1.4):
// usa os paths reais `/app` e `/admin/instituicoes` como initial entries.
function renderForRedirect(initialEntry: string, role: "student" | "admin") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/app/*"
          element={<ProtectedRoute role={role}><div>GuardedContent</div></ProtectedRoute>}
        />
        <Route
          path="/admin/*"
          element={<ProtectedRoute role={role}><div>GuardedContent</div></ProtectedRoute>}
        />
        <Route path="/login" element={<LoginEcho />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("anônimo em /app?x=1 → redirect /login?redirect=%2Fapp%3Fx%3D1 (AC1)", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      recoveryMode: false,
    });
    renderForRedirect("/app?x=1", "student");
    expect(
      screen.getByTestId("login-echo").textContent,
    ).toBe("LoginPage:?redirect=%2Fapp%3Fx%3D1");
  });

  it("anônimo em /admin/instituicoes → redirect /login?redirect=%2Fadmin%2Finstituicoes (AC1 admin)", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      recoveryMode: false,
    });
    renderForRedirect("/admin/instituicoes", "admin");
    expect(
      screen.getByTestId("login-echo").textContent,
    ).toBe("LoginPage:?redirect=%2Fadmin%2Finstituicoes");
  });

  it("loading=true → renderiza skeleton (sem chamar Navigate)", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      recoveryMode: false,
    });
    const { container } = renderAt("/guarded", "student");
    expect(screen.queryByText("LoginPage")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("recoveryMode=true → redirect /reset-password", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: true,
    });
    renderAt("/guarded", "student");
    expect(screen.getByText("ResetPage")).toBeInTheDocument();
  });

  it("role mismatch → redirect /app + toast 'Acesso restrito' (AC2)", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    renderAt("/guarded", "admin");
    expect(screen.getByText("AppRedirectTarget")).toBeInTheDocument();
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Acesso restrito");
    });
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it("admin em rota admin → renderiza conteúdo", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "admin", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    renderAt("/guarded", "admin");
    expect(screen.getByText("GuardedContent")).toBeInTheDocument();
  });

  it("student em rota student → renderiza conteúdo", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    renderAt("/guarded", "student");
    expect(screen.getByText("GuardedContent")).toBeInTheDocument();
  });

  it("user + profile=null + loading=false → skeleton (sem redirect)", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: null,
      loading: false,
      recoveryMode: false,
    });
    const { container } = renderAt("/guarded", "student");
    expect(screen.queryByText("LoginPage")).not.toBeInTheDocument();
    expect(screen.queryByText("GuardedContent")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("user=null + profile populado (logout transitório) → redirect /login", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    renderForRedirect("/app", "student");
    expect(
      screen.getByTestId("login-echo").textContent,
    ).toBe("LoginPage:?redirect=%2Fapp");
  });

  it("children preenchidos (wrapper mode) → renderiza children e não Outlet", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    render(
      <MemoryRouter initialEntries={["/anywhere"]}>
        <Routes>
          <Route
            path="*"
            element={
              <ProtectedRoute role="student">
                <div data-testid="wrapped-child">Wrapped</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("wrapped-child")).toBeInTheDocument();
  });

  it("StrictMode + role mismatch → toast 1x (sem double-toast)", async () => {
    const { StrictMode } = await import("react");
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { role: "student", name: "A" },
      loading: false,
      recoveryMode: false,
    });
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/guarded"]}>
          <Routes>
            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/guarded" element={<div>GuardedContent</div>} />
            </Route>
            <Route path="/app" element={<div>AppRedirectTarget</div>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });
});
