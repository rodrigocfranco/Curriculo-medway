import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const useAuthMock = vi.fn();
const useScoresMock = vi.fn();
const useInstitutionsMock = vi.fn();
const useEditalUrlMock = vi.fn();
const useCurriculumMock = vi.fn();
const navigateMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/queries/scoring", () => ({
  useScores: () => useScoresMock(),
  useInstitutions: () => useInstitutionsMock(),
  useEditalUrl: (...args: unknown[]) => useEditalUrlMock(...args),
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

vi.mock("@/lib/queries/curriculum", () => ({
  useCurriculum: () => useCurriculumMock(),
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
      pub: { score: 10, max: 15, description: "Publicações", category: "Pesquisa e Publicações", label: "Publicações" },
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
      pub: { score: 5, max: 15, description: "Publicações", category: "Pesquisa e Publicações", label: "Publicações" },
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
  useEditalUrlMock.mockReset();
  useCurriculumMock.mockReset();
  navigateMock.mockReset();
  invalidateQueriesMock.mockReset();

  useAuthMock.mockReturnValue({
    user: { id: "user-1" },
    profile: { specialty_interest: null },
  });
  useEditalUrlMock.mockReturnValue(null);
  useCurriculumMock.mockReturnValue({ data: { data: {} } });
});

describe("AppHome (Dashboard)", () => {
  it("renderiza loading skeletons", () => {
    useScoresMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    useInstitutionsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    renderHome();

    expect(screen.getByText(/Sua nota em/)).toBeInTheDocument();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(11);
  });

  it("renderiza dashboard com scores e instituições", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText("Sua nota em 2 instituições")).toBeInTheDocument();
    // UNICAMP aparece no pódio + InstitutionDetailView (top 1)
    expect(screen.getAllByText("UNICAMP").length).toBeGreaterThanOrEqual(2);
    // USP-SP aparece apenas no pódio (2º lugar)
    expect(screen.getByText("USP-SP")).toBeInTheDocument();
    // Notas: top 1 (UNICAMP) aparece no pódio E no header do detalhe
    expect(screen.getAllByText("6,8").length).toBeGreaterThanOrEqual(2);
    // 4,5 só no pódio
    expect(screen.getByText("4,5")).toBeInTheDocument();
  });

  it("renderiza pódio com posições 1º, 2º quando há 2 instituições", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByRole("button", { name: /1º lugar.*UNICAMP/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2º lugar.*USP-SP/i })).toBeInTheDocument();
  });

  it("renderiza seção 'Veja no detalhe sua nota na top 1' com subtítulo", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText(/Veja no detalhe sua nota na top 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/Para ver no detalhe outras instituições/),
    ).toBeInTheDocument();
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

  it("navega para instituição ao clicar no card do pódio", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    fireEvent.click(screen.getByRole("button", { name: /1º lugar.*UNICAMP/i }));
    expect(navigateMock).toHaveBeenCalledWith("/app/instituicoes/inst-1");
  });

  it("renderiza pódio empty state e CTA navega para currículo quando não há scores", () => {
    useScoresMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(
      screen.getByText(/Preencha seu currículo para ver suas top 3/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /preencher currículo/i }));
    expect(navigateMock).toHaveBeenCalledWith("/app/curriculo");
  });

  it("renderiza seção 'Outras instituições' quando há mais de 3 scores", () => {
    const fourInstitutions = [
      ...mockInstitutions,
      {
        id: "inst-3",
        name: "Universidade Federal do Rio de Janeiro",
        short_name: "UFRJ",
        state: "RJ",
        edital_url: null,
        pdf_path: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      {
        id: "inst-4",
        name: "Universidade Federal de Minas Gerais",
        short_name: "UFMG",
        state: "MG",
        edital_url: null,
        pdf_path: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ];
    const fourScores = [
      ...mockScores,
      {
        ...mockScores[0],
        institution_id: "inst-3",
        score: 30,
      },
      {
        ...mockScores[0],
        institution_id: "inst-4",
        score: 20,
      },
    ];

    useScoresMock.mockReturnValue({ data: fourScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: fourInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.getByText("Outras instituições")).toBeInTheDocument();
    expect(screen.getByText("UFMG")).toBeInTheDocument();
  });

  it("não renderiza seção 'Outras instituições' quando há apenas top 3", () => {
    useScoresMock.mockReturnValue({ data: mockScores, isLoading: false, isError: false });
    useInstitutionsMock.mockReturnValue({ data: mockInstitutions, isLoading: false, isError: false });

    renderHome();

    expect(screen.queryByText("Outras instituições")).not.toBeInTheDocument();
  });
});
