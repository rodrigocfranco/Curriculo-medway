import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "lucas@medway.com" },
    profile: { name: "Lucas Silva", role: "student" },
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

  it("renderiza slot do SpecialtySelector", () => {
    renderShell();
    expect(screen.getByTestId("specialty-selector-slot")).toBeInTheDocument();
  });

  it("renderiza UserMenu (trigger com data-testid='user-menu')", () => {
    renderShell();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  it("header sticky: classes 'sticky', 'top-0' e altura 'h-14 md:h-16' (56/64px — AC3)", () => {
    const { container } = renderShell();
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header!.className).toMatch(/\bsticky\b/);
    expect(header!.className).toMatch(/\btop-0\b/);
    expect(header!.className).toMatch(/\bh-14\b/);
    expect(header!.className).toMatch(/\bmd:h-16\b/);
  });

  it("container main com max-w-7xl", () => {
    const { container } = renderShell();
    const main = container.querySelector("main");
    expect(main!.className).toMatch(/\bmax-w-7xl\b/);
  });

  it("Outlet renderiza rota filha", () => {
    renderShell();
    expect(screen.getByText("HomeOutlet")).toBeInTheDocument();
  });
});
