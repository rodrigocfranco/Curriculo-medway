import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";

const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
}));

import Signup from "./Signup";

function renderSignup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Signup page", () => {
  it("renderiza heading 'Criar minha conta' e o formulário", () => {
    renderSignup();
    expect(
      screen.getByRole("heading", { level: 1, name: "Criar minha conta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Criar minha conta/ }),
    ).toBeInTheDocument();
  });

  it("oferece link 'Entrar' para /login", () => {
    renderSignup();
    const link = screen.getByRole("link", { name: "Entrar" });
    expect(link).toHaveAttribute("href", "/login");
  });
});
