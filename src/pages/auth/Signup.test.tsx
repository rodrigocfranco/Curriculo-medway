import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signUp: vi.fn() } },
}));

import Signup from "./Signup";

describe("Signup page", () => {
  it("renderiza heading 'Criar minha conta' e o formulário", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Criar minha conta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar minha conta" }),
    ).toBeInTheDocument();
  });

  it("oferece link 'Entrar' para /login", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const link = screen.getByRole("link", { name: "Entrar" });
    expect(link).toHaveAttribute("href", "/login");
  });
});
