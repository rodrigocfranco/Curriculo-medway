import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Podium } from "./Podium";
import type { Institution, UserScore } from "@/lib/schemas/scoring";

function makeInstitution(id: string, shortName: string): Institution {
  return {
    id,
    name: `Instituição ${shortName}`,
    short_name: shortName,
    state: "SP",
    edital_url: null,
    pdf_path: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}

function makeScore(id: string, value: number): UserScore {
  return {
    user_id: "user-1",
    institution_id: id,
    specialty_id: "00000000-0000-0000-0000-000000000000",
    score: value,
    max_score: 100,
    breakdown: {
      pub: { score: 10, max: 15, description: "Publicações" },
    },
    stale: false,
    calculated_at: "2026-01-01",
  };
}

const entries = [
  { institution: makeInstitution("inst-1", "UNICAMP"), score: makeScore("inst-1", 85) },
  { institution: makeInstitution("inst-2", "USP"), score: makeScore("inst-2", 72) },
  { institution: makeInstitution("inst-3", "UFRJ"), score: makeScore("inst-3", 60) },
];

describe("Podium", () => {
  it("renderiza 3 cards com nomes e notas", () => {
    render(<Podium entries={entries} onCardClick={vi.fn()} />);

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("USP")).toBeInTheDocument();
    expect(screen.getByText("UFRJ")).toBeInTheDocument();
    expect(screen.getByText("8,5")).toBeInTheDocument();
    expect(screen.getByText("7,2")).toBeInTheDocument();
    expect(screen.getByText("6,0")).toBeInTheDocument();
  });

  it("indica posição 1º, 2º e 3º via aria-label", () => {
    render(<Podium entries={entries} onCardClick={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: /1º lugar.*UNICAMP/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /2º lugar.*USP/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /3º lugar.*UFRJ/i }),
    ).toBeInTheDocument();
  });

  it("chama onCardClick com institution_id correto", () => {
    const onCardClick = vi.fn();
    render(<Podium entries={entries} onCardClick={onCardClick} />);

    fireEvent.click(screen.getByRole("button", { name: /1º lugar.*UNICAMP/i }));
    expect(onCardClick).toHaveBeenCalledWith("inst-1");

    fireEvent.click(screen.getByRole("button", { name: /2º lugar.*USP/i }));
    expect(onCardClick).toHaveBeenCalledWith("inst-2");
  });

  it("dispara onCardClick ao pressionar Enter", () => {
    const onCardClick = vi.fn();
    render(<Podium entries={entries} onCardClick={onCardClick} />);

    fireEvent.keyDown(
      screen.getByRole("button", { name: /1º lugar.*UNICAMP/i }),
      { key: "Enter" },
    );
    expect(onCardClick).toHaveBeenCalledWith("inst-1");
  });

  it("renderiza estado vazio quando não há entries", () => {
    render(<Podium entries={[]} onCardClick={vi.fn()} onEmptyClick={vi.fn()} />);

    expect(screen.getByText(/preencha seu currículo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /preencher currículo/i }),
    ).toBeInTheDocument();
  });

  it("dispara onEmptyClick no CTA do estado vazio", () => {
    const onEmptyClick = vi.fn();
    render(
      <Podium
        entries={[]}
        onCardClick={vi.fn()}
        onEmptyClick={onEmptyClick}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /preencher currículo/i }),
    );
    expect(onEmptyClick).toHaveBeenCalledOnce();
  });

  it("renderiza apenas as posições disponíveis quando há menos de 3 entries", () => {
    render(<Podium entries={entries.slice(0, 2)} onCardClick={vi.fn()} />);

    expect(screen.getByText("UNICAMP")).toBeInTheDocument();
    expect(screen.getByText("USP")).toBeInTheDocument();
    expect(screen.queryByText("UFRJ")).not.toBeInTheDocument();
  });

  it("usa institution.name quando short_name é null", () => {
    const noShort = [
      {
        institution: { ...entries[0].institution, short_name: null },
        score: entries[0].score,
      },
    ];
    render(<Podium entries={noShort} onCardClick={vi.fn()} />);

    expect(screen.getByText("Instituição UNICAMP")).toBeInTheDocument();
  });
});
