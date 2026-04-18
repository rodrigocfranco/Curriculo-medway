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
    publicacoes: { score: 10, max: 15, description: "Publicações" },
    ic: { score: 20, max: 20, description: "Iniciação Científica" },
    monitoria: { score: 2, max: 5, description: "Monitoria" },
    ligas: { score: 5, max: 5, description: "Ligas" },
    voluntariado: { score: 0, max: 5, description: "Voluntariado" },
    cursos: { score: 5, max: 5, description: "Cursos" },
    formacao: { score: 10, max: 25, description: "Formação" },
    idiomas: { score: 10, max: 10, description: "Idiomas" },
    eventos: { score: 6, max: 10, description: "Eventos" },
  },
  stale: false,
  calculated_at: "2026-01-01T00:00:00Z",
};

describe("ScoreCard", () => {
  it("renderiza estado completo com score, barra e gap", () => {
    const onClick = vi.fn();
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={onClick} />,
    );

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    // 68/100 = nota 6,8
    expect(screen.getByText("6,8")).toBeInTheDocument();
    // Top gap: Formação has delta 15 (max 25 - score 10)
    expect(screen.getByText(/\+15 em Formação/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renderiza estado parcial com badge Parcial", () => {
    const partialScore: UserScore = {
      ...mockScore,
      score: 12,
      breakdown: {
        publicacoes: { score: 10, max: 15, description: "Publicações" },
        ic: { score: 2, max: 20, description: "Iniciação Científica" },
        monitoria: { score: 0, max: 5, description: "Monitoria" },
        ligas: { score: 0, max: 5, description: "Ligas" },
        voluntariado: { score: 0, max: 5, description: "Voluntariado" },
        cursos: { score: 0, max: 5, description: "Cursos" },
        formacao: { score: 0, max: 25, description: "Formação" },
        idiomas: { score: 0, max: 10, description: "Idiomas" },
        eventos: { score: 0, max: 10, description: "Eventos" },
      },
    };

    render(
      <ScoreCard institution={mockInstitution} score={partialScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("Parcial")).toBeInTheDocument();
  });

  it("renderiza estado vazio com CTA 'Comece a preencher'", () => {
    render(
      <ScoreCard institution={mockInstitution} score={null} onClick={vi.fn()} />,
    );

    expect(screen.getByText("Comece a preencher")).toBeInTheDocument();
    expect(screen.getByText("Sem dados ainda")).toBeInTheDocument();
  });

  it("renderiza estado vazio quando score é 0 com breakdown todo zerado", () => {
    const zeroScore: UserScore = {
      ...mockScore,
      score: 0,
      breakdown: {
        publicacoes: { score: 0, max: 15, description: "Publicações" },
        ic: { score: 0, max: 20, description: "Iniciação Científica" },
      },
    };

    render(
      <ScoreCard institution={mockInstitution} score={zeroScore} onClick={vi.fn()} />,
    );

    expect(screen.getByText("Comece a preencher")).toBeInTheDocument();
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

  it("tem aria-label completo para score preenchido", () => {
    render(
      <ScoreCard institution={mockInstitution} score={mockScore} onClick={vi.fn()} />,
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "UNICAMP, nota 6,8, mais 15 possíveis em Formação, botão ver detalhes",
    );
  });

  it("tem aria-label correto para estado vazio", () => {
    render(
      <ScoreCard institution={mockInstitution} score={null} onClick={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: /sem score, botão preencher currículo/ }),
    ).toBeInTheDocument();
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
