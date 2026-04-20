import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const useAuthMock = vi.fn();
const useScoresMock = vi.fn();
const useInstitutionsMock = vi.fn();
const navigateMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/queries/scoring", () => ({
  useScores: () => useScoresMock(),
  useInstitutions: () => useInstitutionsMock(),
  useSpecialties: () => ({
    data: [{ id: "spec-1", name: "Cardiologia", created_at: "2026-01-01" }],
    isLoading: false,
  }),
  useUpdateSpecialty: () => ({ mutate: vi.fn() }),
  scoringKeys: {
    scores: (userId: string, specialtyId?: string) => ["scores", userId, specialtyId ?? "default"],
    institutions: ["institutions"],
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

import AppHome from "./Home";

const mockInstitutions = [
  {
    id: "inst-1",
    name: "Universidade Estadual de Campinas",
    short_name: "UNICAMP",
    state: "SP",
    edital_url: null,
    pdf_path: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "inst-2",
    name: "Universidade de São Paulo",
    short_name: "USP-SP",
    state: "SP",
    edital_url: null,
    pdf_path: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const mockScores = [
  {
    user_id: "user-1",
    institution_id: "inst-1",
    specialty_id: "default",
    score: 68,
    max_score: 100,
    breakdown: {
      pub: { score: 10, max: 15, description: "Publicações" },
    },
    stale: false,
    calculated_at: "2026-01-01",
  },
  {
    user_id: "user-1",
    institution_id: "inst-2",
    specialty_id: "default",
    score: 45,
    max_score: 100,
    breakdown: {
      pub: { score: 5, max: 15, description: "Publicações" },
    },
    stale: false,
    calculated_at: "2026-01-01",
  },
];

function renderHome() {
  return render(
    <MemoryRouter>
      <AppHome />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
  useScoresMock.mockReset();
  useInstitutionsMock.mockReset();
  navigateMock.mockReset();
  invalidateQueriesMock.mockReset();

  useAuthMock.mockReturnValue({
    user: { id: "user-1" },
    profile: { specialty_interest: null },
  });
});

describe("AppHome (Dashboard)", () => {
  it("renderiza loading skeletons", () => {
    useScoresMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    useInstitutionsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderHome();

    expect(screen.getByText(/Sua nota em/)).toBeInTheDocument();
    // 11 skeletons + 1 narrative skeleton = check for multiple skeletons
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(11);
  });

  it("renderiza dashboard com scores e instituições", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText("Sua nota em 2 instituições")).toBeInTheDocument();
    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("USP-SP")).toBeInTheDocument();
    // Notas: 68/100 = 6,8 e 45/100 = 4,5
    expect(screen.getByText("6,8")).toBeInTheDocument();
    expect(screen.getByText("4,5")).toBeInTheDocument();
  });

  it("renderiza NarrativeBanner com dados", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText(/Você está mais competitivo em/)).toBeInTheDocument();
  });

  it("renderiza DisclaimerBanner compact", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText(/Scores são estimativas/)).toBeInTheDocument();
  });

  it("renderiza estado de erro com botão retry", () => {
    useScoresMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    useInstitutionsMock.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText(/Não conseguimos carregar seus scores/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tentar novamente"));
    expect(invalidateQueriesMock).toHaveBeenCalled();
  });

  it("navega para instituição ao clicar no card", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    const cards = screen.getAllByRole("button");
    fireEvent.click(cards[0]);
    expect(navigateMock).toHaveBeenCalledWith("/app/instituicoes/inst-1");
  });
});
