import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

import AppHome from "./Home";

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("AppHome", () => {
  it("renderiza saudação com profile.name e role", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "Lucas Silva", role: "student" },
    });
    render(<AppHome />);
    expect(screen.getByText(/Olá, Lucas Silva/)).toBeInTheDocument();
    expect(screen.getByText(/student/)).toBeInTheDocument();
  });

  it("fallback para user.email quando profile.name vazio", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: null, role: "student" },
    });
    render(<AppHome />);
    expect(screen.getByText(/Olá, lucas@medway.com/)).toBeInTheDocument();
  });
});
