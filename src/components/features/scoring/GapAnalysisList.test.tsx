import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GapAnalysisList } from "./GapAnalysisList";
import type { ScoreBreakdown } from "@/lib/schemas/scoring";

const mockBreakdown: ScoreBreakdown = {
  publicacoes: { score: 10, max: 15, description: "Autor principal indexado (10pts) | Coautor (5pts)", category: "Pesquisa e Publicações", label: "Publicações científicas" },
  ic: { score: 20, max: 20, description: "Bolsa Oficial (20pts) | Voluntária (10pts)", category: "Pesquisa e Publicações", label: "Iniciação Científica" },
  monitoria: { score: 2, max: 5, description: "Monitoria acadêmica registrada (5pts)", category: "Atividades Acadêmicas", label: "Monitoria acadêmica" },
};

describe("GapAnalysisList", () => {
  it("agrupa por categoria e ordena por delta descendente", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Verificar que categorias aparecem na ordem certa (maior delta primeiro)
    const headings = screen.getAllByRole("heading", { level: 3 });
    // Maior delta primeiro: Pesquisa e Publicações (delta 5) > Atividades Acadêmicas (delta 3)
    expect(headings[0]).toHaveTextContent("Pesquisa e Publicações");
    expect(headings[1]).toHaveTextContent("Atividades Acadêmicas");
  });

  it("exibe totais por categoria", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Pesquisa e Publicações: pub 10/15 + ic 20/20 = 30/35
    expect(screen.getAllByText("30/35").length).toBeGreaterThanOrEqual(1);

    // Atividades Acadêmicas: monitoria 2/5
    expect(screen.getAllByText("2/5").length).toBeGreaterThanOrEqual(1);

    // "+5 pontos possíveis" aparece no total da categoria
    expect(screen.getAllByText(/possíveis/).length).toBeGreaterThanOrEqual(1);
  });

  it("exibe labels dos campos dentro da categoria", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    expect(screen.getByText("Publicações científicas")).toBeInTheDocument();
    expect(screen.getByText("Iniciação Científica")).toBeInTheDocument();
    expect(screen.getByText("Monitoria acadêmica")).toBeInTheDocument();
  });

  it("exibe '✓ Máximo atingido' para campo com delta 0", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    expect(screen.getByText("✓ Máximo atingido")).toBeInTheDocument();
    expect(screen.getAllByText("20/20").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza mensagem vazia quando breakdown é vazio", () => {
    render(<GapAnalysisList breakdown={{}} />);

    expect(screen.getByText("Nenhuma categoria de pontuação disponível.")).toBeInTheDocument();
  });

  it("mostra regras colapsadas por padrão", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Labels das regras visíveis
    expect(screen.getByText("Publicações científicas")).toBeInTheDocument();
    expect(screen.getByText("Iniciação Científica")).toBeInTheDocument();
    expect(screen.getByText("Monitoria acadêmica")).toBeInTheDocument();

    // Chevrons de expandir visíveis
    const chevrons = document.querySelectorAll("[data-state]");
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it("expande regra ao clicar no header", () => {
    render(<GapAnalysisList breakdown={mockBreakdown} />);

    // Clicar no label da primeira regra para expandir
    fireEvent.click(screen.getByText("Publicações científicas"));

    // Após expandir, conteúdo "Como pontuar" aparece
    expect(screen.getByText("Como pontuar")).toBeInTheDocument();
  });

  it("agrupa em 'Outros' quando category não está presente", () => {
    const breakdownSemCategory: ScoreBreakdown = {
      campo_legado: { score: 5, max: 10, description: "Campo sem category" },
    };

    render(<GapAnalysisList breakdown={breakdownSemCategory} />);

    expect(screen.getByText("Outros")).toBeInTheDocument();
    expect(screen.getAllByText("5/10").length).toBeGreaterThanOrEqual(1);
  });
});
