import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/queries/account", () => ({
  useDeleteAccount: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ data: { deleted: true }, error: null }),
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/scoring", () => ({
  useSpecialties: () => ({
    data: [
      { id: "spec-uuid-1", name: "Cardiologia", created_at: "2026-01-01" },
    ],
    isLoading: false,
  }),
}));

import Conta from "./Conta";

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Conta />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue({
    user: { id: "u1", email: "maria@test.com" },
    profile: {
      name: "Maria Silva",
      phone: "(11) 99999-0000",
      state: "SP",
      university: "USP",
      graduation_year: 2025,
      specialty_interest: "spec-uuid-1",
    },
    signOut: vi.fn(),
  });
});

describe("Conta page", () => {
  it("renderiza título da página", () => {
    renderWithProviders();
    expect(screen.getByText("Minha conta")).toBeInTheDocument();
  });

  it("renderiza informações de cadastro do user", () => {
    renderWithProviders();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("maria@test.com")).toBeInTheDocument();
    expect(screen.getByText("(11) 99999-0000")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
    expect(screen.getByText("USP")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
  });

  it("renderiza seção de exclusão de conta", () => {
    renderWithProviders();
    expect(screen.getByText("Excluir conta")).toBeInTheDocument();
    expect(
      screen.getByTestId("open-delete-dialog"),
    ).toBeInTheDocument();
  });

  it("abre dialog ao clicar em 'Excluir minha conta'", () => {
    renderWithProviders();
    fireEvent.click(screen.getByTestId("open-delete-dialog"));
    expect(screen.getByRole("heading", { name: "Excluir minha conta" })).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-confirmation-input"),
    ).toBeInTheDocument();
  });

  it("botão confirmar desabilitado até digitar EXCLUIR", () => {
    renderWithProviders();
    fireEvent.click(screen.getByTestId("open-delete-dialog"));

    const confirmBtn = screen.getByTestId("confirm-delete-account");
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByTestId("delete-confirmation-input");
    fireEvent.change(input, { target: { value: "EXCLUIR" } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("exibe traço quando campo de profile está vazio", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1", email: "test@test.com" },
      profile: {
        name: "Test",
        phone: null,
        state: null,
        university: null,
        graduation_year: null,
        specialty_interest: null,
      },
      signOut: vi.fn(),
    });
    renderWithProviders();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
