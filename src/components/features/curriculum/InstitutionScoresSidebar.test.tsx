import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useScoresMock = vi.fn();
const useInstitutionsMock = vi.fn();

vi.mock("@/lib/queries/scoring", () => ({
  useScores: () => useScoresMock(),
  useInstitutions: () => useInstitutionsMock(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { InstitutionScoresSidebar } from "./InstitutionScoresSidebar";

const institutions = [
  { id: "A", name: "Inst A", short_name: "A" },
  { id: "B", name: "Inst B", short_name: "B" },
];

function makeScore(institution_id: string, score: number, max = 100) {
  return {
    user_id: "u1",
    institution_id,
    specialty_id: "00000000-0000-0000-0000-000000000000",
    score,
    max_score: max,
    breakdown: {},
    stale: false,
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function renderSidebar() {
  return render(
    <MemoryRouter>
      <InstitutionScoresSidebar userId="u1" />
    </MemoryRouter>,
  );
}

describe("InstitutionScoresSidebar", () => {
  beforeEach(() => {
    useScoresMock.mockReset();
    useInstitutionsMock.mockReset();
    useInstitutionsMock.mockReturnValue({
      data: institutions,
      isLoading: false,
    });
  });

  it("limpa deltas quando mudanças retornam ao estado da âncora", () => {
    // Render 1: âncora é fixada com [A=8,0 pos1; B=6,0 pos2]
    useScoresMock.mockReturnValue({
      data: [makeScore("A", 80), makeScore("B", 60)],
      isLoading: false,
    });
    const { rerender } = renderSidebar();

    // Sem deltas iniciais
    expect(screen.queryByText("+2,5")).toBeNull();

    // Render 2: B sobe para 85 e ultrapassa A — deltas ficam visíveis
    useScoresMock.mockReturnValue({
      data: [makeScore("B", 85), makeScore("A", 80)],
      isLoading: false,
    });
    rerender(
      <MemoryRouter>
        <InstitutionScoresSidebar userId="u1" />
      </MemoryRouter>,
    );

    expect(screen.getByText("+2,5")).toBeInTheDocument();

    // Render 3: usuário desfaz — scores voltam ao estado da âncora.
    // Os deltas antigos devem desaparecer (não devem ficar congelados).
    useScoresMock.mockReturnValue({
      data: [makeScore("A", 80), makeScore("B", 60)],
      isLoading: false,
    });
    rerender(
      <MemoryRouter>
        <InstitutionScoresSidebar userId="u1" />
      </MemoryRouter>,
    );

    expect(screen.queryByText("+2,5")).toBeNull();
  });
});
