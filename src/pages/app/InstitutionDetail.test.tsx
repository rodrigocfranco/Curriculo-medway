import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useAuthMock = vi.fn();
const useInstitutionScoreMock = vi.fn();
const useEditalUrlMock = vi.fn();
const invalidateQueriesMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/queries/curriculum", () => ({
  useCurriculum: () => ({ data: { data: { mestrado_status: "Não tenho", doutorado_status: "Não tenho" } } }),
}));

vi.mock("@/lib/queries/scoring", () => ({
  useInstitutionScore: (...args: unknown[]) => useInstitutionScoreMock(...args),
  useEditalUrl: (...args: unknown[]) => useEditalUrlMock(...args),
  scoringKeys: {
    scores: (userId: string, specialtyId?: string) => ["scores", userId, specialtyId ?? "default"],
    institutions: ["institutions"],
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: invalidateQueriesMock,
    }),
  };
});

import InstitutionDetail from "./InstitutionDetail";

const mockInstitution = {
  id: "inst-1",
  name: "Universidade Estadual de Campinas",
  short_name: "UNICAMP",
  state: "SP",
  edital_url: "https://unicamp.br/edital.pdf",
  pdf_path: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const mockScore = {
  user_id: "user-1",
  institution_id: "inst-1",
  specialty_id: "00000000-0000-0000-0000-000000000000",
  score: 68,
  max_score: 100,
  breakdown: {
    publicacoes: { score: 10, max: 15, description: "Autor principal: 10 pts | Coautor: 5 pts", category: "Publicações", label: "Publicações científicas" },
    ic: { score: 20, max: 20, description: "Bolsa Oficial: 20 pts", category: "Pesquisa", label: "Iniciação Científica" },
    monitoria: { score: 2, max: 5, description: "Monitoria registrada", category: "Pesquisa", label: "Monitoria acadêmica" },
  },
  stale: false,
  calculated_at: "2026-01-01T00:00:00Z",
};

function renderWithRouter(institutionId = "inst-1") {
  return render(
    <MemoryRouter initialEntries={[`/app/instituicoes/${institutionId}`]}>
      <Routes>
        <Route path="/app/instituicoes/:id" element={<InstitutionDetail />} />
        <Route path="/app" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("InstitutionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "user-1" },
      profile: { specialty_interest: null },
    });
  });

  it("renderiza loading skeleton", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: null,
      institution: null,
      isLoading: true,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue(null);

    renderWithRouter();

    // Breadcrumb visible
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    // Skeletons rendered (multiple elements with skeleton class)
    const container = document.querySelector(".space-y-6");
    expect(container).toBeInTheDocument();
  });

  it("renderiza dados completos com ScoreHero, GapAnalysis e DisclaimerBanner", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: mockScore,
      institution: mockInstitution,
      isLoading: false,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue("https://unicamp.br/edital.pdf");

    renderWithRouter();

    // Header
    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();

    // Edital link
    const editalLink = screen.getByText("Ver edital original");
    expect(editalLink.closest("a")).toHaveAttribute("target", "_blank");
    expect(editalLink.closest("a")).toHaveAttribute("rel", "noopener noreferrer");

    // ScoreHero — nota 6,8 (68/100)
    expect(screen.getByText("6,8")).toBeInTheDocument();
    expect(screen.getByText("68 / 100 pontos")).toBeInTheDocument();
    // nota 6.8 → "Bom caminho"
    expect(screen.getByText("Bom caminho — veja onde pode crescer")).toBeInTheDocument();

    // GapAnalysis — categorias agrupadas
    expect(screen.getAllByText("Publicações").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pesquisa").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("10/15 pontos")).toBeInTheDocument();
    expect(screen.getByText("✓ Máximo")).toBeInTheDocument();

    // DisclaimerBanner
    expect(screen.getByText(/estimativas baseadas em editais públicos/)).toBeInTheDocument();
  });

  it("renderiza estado de erro com botão retry", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: null,
      institution: null,
      isLoading: false,
      isError: true,
    });
    useEditalUrlMock.mockReturnValue(null);

    renderWithRouter();

    expect(
      screen.getByText("Não conseguimos carregar os detalhes desta instituição."),
    ).toBeInTheDocument();

    const retryButton = screen.getByText("Tentar novamente");
    fireEvent.click(retryButton);
    expect(invalidateQueriesMock).toHaveBeenCalled();
  });

  it("renderiza 404 quando instituição não encontrada", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: null,
      institution: null,
      isLoading: false,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue(null);

    renderWithRouter("non-existent-id");

    expect(screen.getByText("Instituição não encontrada")).toBeInTheDocument();
    expect(screen.getByText("← Voltar ao dashboard")).toBeInTheDocument();
  });

  it("renderiza link edital com URL direta", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: mockScore,
      institution: mockInstitution,
      isLoading: false,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue("https://unicamp.br/edital.pdf");

    renderWithRouter();

    const link = screen.getByText("Ver edital original").closest("a");
    expect(link).toHaveAttribute("href", "https://unicamp.br/edital.pdf");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("não renderiza link edital quando URL não disponível", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: mockScore,
      institution: { ...mockInstitution, edital_url: null },
      isLoading: false,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue(null);

    renderWithRouter();

    expect(screen.queryByText("Ver edital original")).not.toBeInTheDocument();
  });

  it("renderiza acessibilidade: sr-only 'abre em nova aba'", () => {
    useInstitutionScoreMock.mockReturnValue({
      score: mockScore,
      institution: mockInstitution,
      isLoading: false,
      isError: false,
    });
    useEditalUrlMock.mockReturnValue("https://unicamp.br/edital.pdf");

    renderWithRouter();

    expect(screen.getByText("(abre em nova aba)")).toBeInTheDocument();
  });
});
