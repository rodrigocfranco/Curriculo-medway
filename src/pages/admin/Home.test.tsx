import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/lib/queries/admin", () => ({
  useInstitutions: () => ({
    data: [
      {
        id: "inst-1",
        name: "Universidade Estadual de Campinas",
        short_name: "UNICAMP",
        state: "SP",
        edital_url: null,
        pdf_path: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    isLoading: false,
  }),
  useInstitutionRuleCounts: () => ({
    data: { "inst-1": 3 },
  }),
  useCreateInstitution: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateInstitution: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteInstitution: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import AdminHome from "./Home";

describe("AdminHome", () => {
  it("renderiza heading 'Instituições' e botão 'Nova instituição'", () => {
    render(<TooltipProvider><AdminHome /></TooltipProvider>);
    expect(
      screen.getByRole("heading", { name: "Instituições" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nova instituição/i }),
    ).toBeInTheDocument();
  });

  it("exibe tabela com dados das instituições", () => {
    render(<TooltipProvider><AdminHome /></TooltipProvider>);
    expect(screen.getByText("UNICAMP")).toBeInTheDocument(); // short_name
    expect(screen.getByText("SP")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
