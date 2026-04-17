import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useAuthMock = vi.fn();
const useSpecialtiesMock = vi.fn();
const useUpdateSpecialtyMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/queries/scoring", () => ({
  useSpecialties: () => useSpecialtiesMock(),
  useUpdateSpecialty: () => useUpdateSpecialtyMock(),
}));

import { SpecialtySelector } from "./SpecialtySelector";

const SPEC_1_UUID = "a0000000-0000-0000-0000-000000000001";
const mockSpecialties = [
  { id: SPEC_1_UUID, name: "Cardiologia", created_at: "2026-01-01" },
  { id: "b0000000-0000-0000-0000-000000000002", name: "Ortopedia", created_at: "2026-01-01" },
];

beforeEach(() => {
  useAuthMock.mockReset();
  useSpecialtiesMock.mockReset();
  useUpdateSpecialtyMock.mockReset();

  useAuthMock.mockReturnValue({
    user: { id: "user-1" },
    profile: { specialty_interest: null },
  });

  useUpdateSpecialtyMock.mockReturnValue({
    mutate: vi.fn(),
  });
});

describe("SpecialtySelector", () => {
  it("renderiza com 'Todas as especialidades' quando specialty_interest é null", () => {
    useSpecialtiesMock.mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
    });

    render(<SpecialtySelector />);

    expect(screen.getByText("Todas as especialidades")).toBeInTheDocument();
  });

  it("renderiza nome da especialidade selecionada", () => {
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      profile: { specialty_interest: SPEC_1_UUID },
    });
    useSpecialtiesMock.mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
    });

    render(<SpecialtySelector />);

    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
  });

  it("não renderiza enquanto carrega", () => {
    useSpecialtiesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<SpecialtySelector />);
    expect(container.innerHTML).toBe("");
  });

  it("tem aria-label no trigger", () => {
    useSpecialtiesMock.mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
    });

    render(<SpecialtySelector />);

    expect(
      screen.getByRole("combobox", { name: "Selecionar especialidade" }),
    ).toBeInTheDocument();
  });

  it("tem região aria-live para feedback", () => {
    useSpecialtiesMock.mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
    });

    render(<SpecialtySelector />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
