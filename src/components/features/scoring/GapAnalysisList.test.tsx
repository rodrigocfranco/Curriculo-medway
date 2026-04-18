import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GapAnalysisList } from "./GapAnalysisList";
import type { ScoreBreakdown } from "@/lib/schemas/scoring";

const mockBreakdown: ScoreBreakdown = {
  publicacoes: { score: 10, max: 15, description: "Autor principal indexado (10pts) | Coautor (5pts)", category: "Publicações", label: "Publicações científicas" },
  ic: { score: 20, max: 20, description: "Bolsa Oficial (20pts) | Voluntária (10pts)", category: "Pesquisa", label: "Iniciação Científica" },
  monitoria: { score: 2, max: 5, description: "Monitoria acadêmica registrada (5pts)", category: "Pesquisa", label: "Monitoria acadêmica" },
};

describe("GapAnalysisList", () => {
  it("agrupa por categoria e ordena por delta descendente", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Verificar que categorias aparecem na ordem certa (maior delta primeiro)
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("Publicações");
    expect(headings[1]).toHaveTextContent("Pesquisa");
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

  it("mostra regras expandidas por padrão quando delta > 0", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Publicações (delta 5) deve estar expandida, mostrando itens parseados
    expect(screen.getByText("Autor principal indexado")).toBeInTheDocument();
    expect(screen.getByText("10 pts")).toBeInTheDocument();
    expect(screen.getByText("Coautor")).toBeInTheDocument();
    // "5 pts" aparece em Publicações e Monitoria
    expect(screen.getAllByText("5 pts").length).toBeGreaterThanOrEqual(1);
  });

  it("mostra 'Como pontuar' ao invés de 'Saiba +'", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Campos com delta > 0 mostram "Ocultar" (já aberto)
    expect(screen.getAllByText("Ocultar").length).toBeGreaterThan(0);
    // Campos com delta = 0 mostram "Como pontuar" (fechado)
    expect(screen.getAllByText("Como pontuar").length).toBeGreaterThan(0);
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
