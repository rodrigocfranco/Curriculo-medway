import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "lucas@medway.com" },
    profile: { name: "Lucas Silva", role: "student", specialty_interest: null },
    signOut: vi.fn(),
  }),
}));

import AppShell from "./AppShell";

describe("AppShell", () => {
  function renderShell(path = "/app") {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<div>HomeOutlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renderiza logo 'Medway' com link para /app", () => {
    renderShell();
    const logo = screen.getByRole("link", { name: "Medway" });
    expect(logo).toHaveAttribute("href", "/app");
  });

  it("renderiza navegação com Dashboard e Currículo", () => {
    renderShell();
    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
    const curriculoLinks = screen.getAllByRole("link", { name: "Currículo" });
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    expect(curriculoLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza UserMenu", () => {
    renderShell();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("não mostra banner admin para student", () => {
    renderShell();
    expect(screen.queryByText(/Voltar ao painel admin/)).not.toBeInTheDocument();
  });

  it("header sticky", () => {
    const { container } = renderShell();
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header!.className).toMatch(/\bsticky\b/);
  });

  it("Outlet renderiza rota filha", () => {
    renderShell();
    expect(screen.getByText("HomeOutlet")).toBeInTheDocument();
  });
});

describe("AppShell (admin)", () => {
  it("mostra banner 'Voltar ao painel admin' para admin", async () => {
    vi.resetModules();

    vi.doMock("@/contexts/useAuth", () => ({
      useAuth: () => ({
        user: { id: "u1", email: "admin@medway.com" },
        profile: { name: "Admin", role: "admin", specialty_interest: null },
        signOut: vi.fn(),
      }),
    }));

    const { default: AppShellAdmin } = await import("./AppShell");

    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/app" element={<AppShellAdmin />}>
            <Route index element={<div>HomeOutlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Voltar ao painel admin/)).toBeInTheDocument();
  });
});
