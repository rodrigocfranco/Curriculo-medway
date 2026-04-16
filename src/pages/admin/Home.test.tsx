import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

import AdminHome from "./Home";

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("AdminHome", () => {
  it("renderiza heading 'Instituições' + nome do admin", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "admin@medway.com" },
      profile: { name: "Admin Medway", role: "admin" },
    });
    render(<AdminHome />);
    expect(
      screen.getByRole("heading", { name: "Instituições" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Admin Medway/)).toBeInTheDocument();
  });

  it("fallback: profile=null → usa user.email", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "admin@medway.com" },
      profile: null,
    });
    render(<AdminHome />);
    expect(screen.getByText(/admin@medway\.com/)).toBeInTheDocument();
  });
});
