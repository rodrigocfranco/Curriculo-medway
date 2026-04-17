import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NarrativeBanner } from "./NarrativeBanner";
import type { UserScore, Institution } from "@/lib/schemas/scoring";

const institutions: Institution[] = [
  {
    id: "inst-1",
    name: "Universidade Estadual de Campinas",
    short_name: "UNICAMP",
    state: "SP",
    edital_url: null,
    pdf_path: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "inst-2",
    name: "Universidade de São Paulo",
    short_name: "USP-SP",
    state: "SP",
    edital_url: null,
    pdf_path: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function makeScore(
  instId: string,
  score: number,
  maxScore: number,
  breakdown: UserScore["breakdown"],
): UserScore {
  return {
    user_id: "user-1",
    institution_id: instId,
    specialty_id: "00000000-0000-0000-0000-000000000000",
    score,
    max_score: maxScore,
    breakdown,
    stale: false,
    calculated_at: "2026-01-01T00:00:00Z",
  };
}

describe("NarrativeBanner", () => {
  it("mostra narrativa com top e oportunidade", () => {
    const scores: UserScore[] = [
      makeScore("inst-1", 68, 100, {
        pub: { score: 10, max: 15, description: "Publicações" },
        form: { score: 10, max: 25, description: "Formação" },
      }),
      makeScore("inst-2", 40, 100, {
        pub: { score: 5, max: 15, description: "Publicações" },
        form: { score: 5, max: 25, description: "Formação" },
      }),
    ];

    render(<NarrativeBanner scores={scores} institutions={institutions} />);

    // USP-SP has gap 60 > UNICAMP gap 32
    expect(
      screen.getByText(/Você está mais competitivo em UNICAMP/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Maior oportunidade: \+60 em USP-SP, Formação/)).toBeInTheDocument();
  });

  it("mostra fallback quando scores vazios", () => {
    render(<NarrativeBanner scores={[]} institutions={institutions} />);

    expect(
      screen.getByText("Preencha seu currículo para ver onde você se destaca."),
    ).toBeInTheDocument();
  });

  it("mostra fallback quando todos os scores são zero", () => {
    const scores: UserScore[] = [
      makeScore("inst-1", 0, 100, {
        pub: { score: 0, max: 15, description: "Publicações" },
      }),
    ];

    render(<NarrativeBanner scores={scores} institutions={institutions} />);

    expect(
      screen.getByText("Preencha seu currículo para ver onde você se destaca."),
    ).toBeInTheDocument();
  });

  it("tem ícone de bússola", () => {
    render(<NarrativeBanner scores={[]} institutions={institutions} />);
    expect(screen.getByText("🧭")).toBeInTheDocument();
  });
});
