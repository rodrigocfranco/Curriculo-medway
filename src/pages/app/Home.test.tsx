import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import AppHome from "./Home";

beforeEach(() => {
  navigateMock.mockReset();
  useAuthMock.mockReset();
  signOutMock.mockReset();
});

describe("AppHome stub", () => {
  it("redireciona para /login quando user é null", () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      session: null,
      signOut: signOutMock,
    });
    render(
      <MemoryRouter>
        <AppHome />
      </MemoryRouter>,
    );
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("mostra CTA Sair e clicar invoca signOut + navigate('/')", async () => {
    signOutMock.mockResolvedValueOnce(undefined);
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@example.com" },
      profile: { name: "Lucas", role: "student" },
      loading: false,
      session: { access_token: "t" },
      signOut: signOutMock,
    });
    render(
      <MemoryRouter>
        <AppHome />
      </MemoryRouter>,
    );
    const btn = screen.getByRole("button", { name: "Sair" });
    fireEvent.click(btn);
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true }),
    );
    expect(screen.getByText(/Olá, Lucas/)).toBeInTheDocument();
  });
});
