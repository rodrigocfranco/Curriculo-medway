import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InstitutionDetailView } from "./InstitutionDetailView";
import type { UserScore, Institution } from "@/lib/schemas/scoring";

const mockInstitution: Institution = {
  id: "inst-1",
  name: "Universidade Estadual de Campinas",
  short_name: "UNICAMP",
  state: "SP",
  edital_url: "https://unicamp.br/edital.pdf",
  pdf_path: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const mockScore: UserScore = {
  user_id: "user-1",
  institution_id: "inst-1",
  specialty_id: "00000000-0000-0000-0000-000000000000",
  score: 68,
  max_score: 100,
  breakdown: {
    publicacoes: {
      score: 10,
      max: 15,
      description: "Publicações científicas",
      category: "Pesquisa e Publicações",
      label: "Publicações",
    },
    monitoria: {
      score: 2,
      max: 5,
      description: "Monitoria registrada",
      category: "Atividades Acadêmicas",
      label: "Monitoria",
    },
  },
  stale: false,
  calculated_at: "2026-01-01T00:00:00Z",
};

describe("InstitutionDetailView", () => {
  it("renderiza nome da instituição, badge state, nota e link edital", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl="https://unicamp.br/edital.pdf"
        curriculumData={{}}
      />,
    );

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
    expect(screen.getByText("6,8")).toBeInTheDocument();
    expect(screen.getByText("68 / 100 pts")).toBeInTheDocument();

    const editalLink = screen.getByText("Edital").closest("a");
    expect(editalLink).toHaveAttribute("href", "https://unicamp.br/edital.pdf");
    expect(editalLink).toHaveAttribute("target", "_blank");
    expect(editalLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("não renderiza link edital quando editalUrl é null", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl={null}
        curriculumData={{}}
      />,
    );

    expect(screen.queryByText("Edital")).not.toBeInTheDocument();
  });

  it("renderiza categorias do GapAnalysisList", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl={null}
        curriculumData={{}}
      />,
    );

    expect(screen.getAllByText("Pesquisa e Publicações").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Atividades Acadêmicas").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza DisclaimerBanner por padrão", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl={null}
        curriculumData={{}}
      />,
    );

    expect(
      screen.getByText(/estimativas baseadas em editais públicos/),
    ).toBeInTheDocument();
  });

  it("não renderiza DisclaimerBanner quando showDisclaimer=false", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl={null}
        curriculumData={{}}
        showDisclaimer={false}
      />,
    );

    expect(
      screen.queryByText(/estimativas baseadas em editais públicos/),
    ).not.toBeInTheDocument();
  });

  it("não renderiza GapAnalysisList quando score é null", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={null}
        editalUrl={null}
        curriculumData={{}}
      />,
    );

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.queryByText("Pesquisa e Publicações")).not.toBeInTheDocument();
  });

  it("usa institution.name quando short_name é null", () => {
    render(
      <InstitutionDetailView
        institution={{ ...mockInstitution, short_name: null }}
        score={mockScore}
        editalUrl={null}
        curriculumData={{}}
      />,
    );

    expect(screen.getByText("Universidade Estadual de Campinas")).toBeInTheDocument();
  });

  it("renderiza acessibilidade sr-only para edital", () => {
    render(
      <InstitutionDetailView
        institution={mockInstitution}
        score={mockScore}
        editalUrl="https://unicamp.br/edital.pdf"
        curriculumData={{}}
      />,
    );

    expect(screen.getByText("(abre em nova aba)")).toBeInTheDocument();
  });
});
