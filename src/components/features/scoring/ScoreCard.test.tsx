import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ScoreCard } from "./ScoreCard";
import type { UserScore, Institution } from "@/lib/schemas/scoring";

const mockInstitution: Institution = {
  id: "inst-1",
  name: "Universidade Estadual de Campinas",
  short_name: "UNICAMP",
  state: "SP",
  edital_url: null,
  pdf_path: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockScore: UserScore = {
  user_id: "user-1",
  institution_id: "inst-1",
  specialty_id: "00000000-0000-0000-0000-000000000000",
  score: 68,
  max_score: 100,
  breakdown: {
    publicacoes: { score: 10, max: 15, description: "Publicações", label: "Publicações" },
    ic: { score: 20, max: 20, description: "Iniciação Científica", label: "IC" },
    monitoria: { score: 2, max: 5, description: "Monitoria", label: "Monitoria" },
    ligas: { score: 5, max: 5, description: "Ligas", label: "Ligas" },
    voluntariado: { score: 0, max: 5, description: "Voluntariado", label: "Voluntariado" },
    cursos: { score: 5, max: 5, description: "Cursos", label: "Cursos" },
    formacao: { score: 10, max: 25, description: "Formação", label: "Formação" },
    idiomas: { score: 10, max: 10, description: "Idiomas", label: "Idiomas" },
    eventos: { score: 6, max: 10, description: "Eventos", label: "Eventos" },
  },
  stale: false,
  calculated_at: "2026-01-01T00:00:00Z",
};

describe("ScoreCard", () => {
  it("renderiza instituição e nota", () => {
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("6,8")).toBeInTheDocument();
  });

  it("renderiza badge Parcial quando menos de 50% preenchido", () => {
    const partialScore: UserScore = {
      ...mockScore,
      score: 12,
      breakdown: {
        publicacoes: { score: 10, max: 15, description: "Publicações", label: "Publicações" },
        ic: { score: 2, max: 20, description: "IC", label: "IC" },
        monitoria: { score: 0, max: 5, description: "Monitoria", label: "Monitoria" },
        ligas: { score: 0, max: 5, description: "Ligas", label: "Ligas" },
        voluntariado: { score: 0, max: 5, description: "Voluntariado", label: "Voluntariado" },
        cursos: { score: 0, max: 5, description: "Cursos", label: "Cursos" },
        formacao: { score: 0, max: 25, description: "Formação", label: "Formação" },
        idiomas: { score: 0, max: 10, description: "Idiomas", label: "Idiomas" },
        eventos: { score: 0, max: 10, description: "Eventos", label: "Eventos" },
      },
    };

    render(
      <ScoreCard institution={mockInstitution} score={partialScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("Parcial")).toBeInTheDocument();
  });

  it("renderiza estado vazio com botão Preencher", () => {
    render(
      <ScoreCard institution={mockInstitution} score={null} onClick={vi.fn()} />,
    );

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("Preencher")).toBeInTheDocument();
  });

  it("renderiza nota 0,0 quando score é 0 mas breakdown tem dados", () => {
    const zeroScore: UserScore = {
      ...mockScore,
      score: 0,
      breakdown: {
        publicacoes: { score: 0, max: 15, description: "Publicações" },
        ic: { score: 0, max: 20, description: "IC" },
      },
    };

    render(
      <ScoreCard institution={mockInstitution} score={zeroScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("0,0")).toBeInTheDocument();
  });

  it("chama onClick ao clicar no card", () => {
    const onClick = vi.fn();
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={onClick} />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("chama onClick ao pressionar Enter", () => {
    const onClick = vi.fn();
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={onClick} />,
    );

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("tem aria-label com nota", () => {
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={vi.fn()} />,
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "UNICAMP, nota 6,8, ver detalhes",
    );
  });

  it("chama onEmptyClick ao clicar no card vazio", () => {
    const onClick = vi.fn();
    const onEmptyClick = vi.fn();
    render(
      <ScoreCard institution={mockInstitution} score={null} onClick={onClick} onEmptyClick={onEmptyClick} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /sem score/ }));
    expect(onEmptyClick).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("usa institution.name quando short_name é null", () => {
    const instNoShortName = { ...mockInstitution, short_name: null };
    render(
      <ScoreCard institution={instNoShortName} score={mockScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("Universidade Estadual de Campinas")).toBeInTheDocument();
  });
});
