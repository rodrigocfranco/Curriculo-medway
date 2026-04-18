import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GapAnalysisList } from "./GapAnalysisList";
import type { ScoreBreakdown } from "@/lib/schemas/scoring";

const mockBreakdown: ScoreBreakdown = {
  publicacoes: { score: 10, max: 15, description: "Autor principal indexado: 10 pts | Coautor: 5 pts", category: "Publicações", label: "Publicações científicas" },
  ic: { score: 20, max: 20, description: "Bolsa Oficial: 20 pts | Voluntária: 10 pts", category: "Pesquisa", label: "Iniciação Científica" },
  monitoria: { score: 2, max: 5, description: "Monitoria acadêmica registrada", category: "Pesquisa", label: "Monitoria acadêmica" },
};

describe("GapAnalysisList", () => {
  it("agrupa por categoria e ordena por delta descendente", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    const items = screen.getAllByRole("listitem");
    // 2 grupos: Pesquisa (delta 3) e Publicações (delta 5)
    // Publicações primeiro (delta 5 > delta 3)
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Publicações");
    expect(items[1]).toHaveTextContent("Pesquisa");
  });

  it("exibe totais por categoria", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Publicações: 10/15
    expect(screen.getByText("10/15 pontos")).toBeInTheDocument();

    // Pesquisa: 22/25
    expect(screen.getByText("22/25 pontos")).toBeInTheDocument();

    // "+5 possíveis" aparece no total da categoria Publicações e no campo individual
    expect(screen.getAllByText("+5 possíveis").length).toBeGreaterThanOrEqual(1);
  });

  it("exibe labels dos campos dentro da categoria", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    expect(screen.getByText("Publicações científicas")).toBeInTheDocument();
    expect(screen.getByText("Iniciação Científica")).toBeInTheDocument();
    expect(screen.getByText("Monitoria acadêmica")).toBeInTheDocument();
  });

  it("exibe '✓ Máximo' para campo com delta 0", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    expect(screen.getByText("✓ Máximo")).toBeInTheDocument();
    expect(screen.getByText("20/20")).toBeInTheDocument();
  });

  it("renderiza mensagem vazia quando breakdown é vazio", () => {
    render(<GapAnalysisList breakdown={{}} />);

    expect(screen.getByText("Nenhuma categoria de pontuação disponível.")).toBeInTheDocument();
  });

  it("expande descrição ao clicar 'Saiba +'", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    const saibaMais = screen.getAllByText("Saiba +");
    expect(saibaMais.length).toBeGreaterThan(0);

    fireEvent.click(saibaMais[0]);
    expect(screen.getByText("Autor principal indexado: 10 pts | Coautor: 5 pts")).toBeInTheDocument();
  });

  it("agrupa em 'Outros' quando category não está presente", () => {
    const breakdownSemCategory: ScoreBreakdown = {
      campo_legado: { score: 5, max: 10, description: "Campo sem category" },
    };

    render(<GapAnalysisList breakdown={breakdownSemCategory} />);

    expect(screen.getByText("Outros")).toBeInTheDocument();
    expect(screen.getByText("5/10 pontos")).toBeInTheDocument();
  });
});
