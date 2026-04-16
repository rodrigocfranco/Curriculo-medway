import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useAuthMock = vi.fn();
const navigateMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

import UserMenu from "./UserMenu";

beforeEach(() => {
  useAuthMock.mockReset();
  navigateMock.mockReset();
  signOutMock.mockReset();
});

function renderMenu() {
  return render(
    <MemoryRouter>
      <UserMenu />
    </MemoryRouter>,
  );
}

describe("UserMenu", () => {
  it("Avatar fallback usa iniciais (2 chars) de profile.name — 'Lucas Silva' → 'LS'", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "Lucas Silva", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    expect(screen.getByText("LS")).toBeInTheDocument();
  });

  it("Avatar fallback — 'Ana' (1 palavra) → 'A'", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "ana@medway.com" },
      profile: { name: "Ana", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("Avatar fallback — name vazio + email 'lucas@medway.com' → 'L'", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("trigger aria-label personalizado com displayName ('Menu de A')", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "a@b.com" },
      profile: { name: "A", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    const trigger = screen.getByTestId("user-menu");
    expect(trigger).toHaveAttribute("aria-label", "Menu de A");
  });

  it("dropdown mostra email mesmo quando profile.name vazio (sem colapsar labels)", async () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    const trigger = screen.getByTestId("user-menu");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("lucas@medway.com")).toBeInTheDocument();
    });
  });

  it("signOut rejection → reseta guarda e loga erro (sem crash)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    signOutMock.mockRejectedValueOnce(new Error("offline"));
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "Lucas Silva", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    const trigger = screen.getByTestId("user-menu");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    const sair = await screen.findByRole("menuitem", { name: "Sair" });
    fireEvent.click(sair);
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("abrir menu + click 'Sair' → signOut + navigate('/', replace)", async () => {
    signOutMock.mockResolvedValueOnce(undefined);
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "lucas@medway.com" },
      profile: { name: "Lucas Silva", role: "student" },
      signOut: signOutMock,
    });
    renderMenu();
    const trigger = screen.getByTestId("user-menu");
    // Radix DropdownMenu em jsdom abre via keyboard mais confiavelmente que
    // via pointer (jsdom não emite os eventos compostos corretos).
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    const sair = await screen.findByRole("menuitem", { name: "Sair" });
    fireEvent.click(sair);
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
  });
});
