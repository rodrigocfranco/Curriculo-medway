import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "admin@medway.com" },
    profile: { name: "Admin Medway", role: "admin" },
    signOut: vi.fn(),
  }),
}));

import AdminShell from "./AdminShell";

function renderShell(path = "/admin") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<div>AdminHomeOutlet</div>} />
        </Route>
        <Route path="/admin/regras" element={<AdminShell />}>
          <Route index element={<div>RegrasOutlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminShell", () => {
  it("renderiza logo 'Medway' + badge 'Admin' + 4 tabs + UserMenu", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Medway" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    ["Instituições", "Regras", "Leads", "Histórico"].forEach((label) => {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    });
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("aviso mobile 'Painel admin otimizado para desktop' com role='note' + md:hidden", () => {
    renderShell();
    const warning = screen.getByText("Painel admin otimizado para desktop");
    const noteContainer = warning.closest('[role="note"]');
    expect(noteContainer).not.toBeNull();
    expect(noteContainer!.className).toMatch(/md:hidden/);
  });

  it("main tem max-w-screen-2xl + padding compacto (p-3/p-4)", () => {
    const { container } = renderShell();
    const main = container.querySelector("main");
    expect(main!.className).toMatch(/max-w-screen-2xl/);
    expect(main!.className).toMatch(/px-3/);
    expect(main!.className).toMatch(/py-3/);
    expect(main!.className).toMatch(/md:px-4/);
    expect(main!.className).toMatch(/md:py-4/);
  });

  it("Outlet renderiza rota filha", () => {
    renderShell();
    expect(screen.getByText("AdminHomeOutlet")).toBeInTheDocument();
  });

  it("Tab ativa em /admin: 'Instituições' recebe classe de ativo e as demais não", () => {
    renderShell("/admin");
    const instituicoes = screen.getByRole("link", { name: "Instituições" });
    expect(instituicoes.className).toMatch(/font-medium/);
    ["Regras", "Leads", "Histórico"].forEach((label) => {
      const tab = screen.getByRole("link", { name: label });
      expect(tab.className).toMatch(/text-muted-foreground/);
      expect(tab.className).not.toMatch(/font-medium/);
    });
  });

  it("Tab ativa em /admin/regras: 'Regras' ativa e 'Instituições' inativa (end:true não ativa em sub-rota)", () => {
    renderShell("/admin/regras");
    const regras = screen.getByRole("link", { name: "Regras" });
    expect(regras.className).toMatch(/font-medium/);
    const instituicoes = screen.getByRole("link", { name: "Instituições" });
    expect(instituicoes.className).toMatch(/text-muted-foreground/);
    expect(instituicoes.className).not.toMatch(/font-medium/);
  });
});
