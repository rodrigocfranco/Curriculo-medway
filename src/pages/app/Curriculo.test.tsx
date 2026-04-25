import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const mockFieldsByCategory = {
  "Pesquisa e Publicações": [
    {
      id: "1",
      field_key: "artigo_1_fi",
      label: "Artigo 1º autor (FI)",
      field_type: "number",
      category: "Pesquisa e Publicações",
      display_order: 10,
      options: null,
      created_at: "",
    },
    {
      id: "2",
      field_key: "ic_projetos",
      label: "Projetos de IC",
      field_type: "number",
      category: "Pesquisa e Publicações",
      display_order: 20,
      options: null,
      created_at: "",
    },
  ],
};

vi.mock("@/lib/queries/curriculum", () => ({
  useCurriculumFields: () => ({
    data: mockFieldsByCategory,
    isLoading: false,
  }),
  useCurriculum: () => ({
    data: { user_id: "u1", data: {}, updated_at: "2026-01-01T00:00:00Z" },
    isLoading: false,
  }),
  useUpdateCurriculum: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/hooks/use-autosave", () => ({
  useAutosave: () => ({
    status: "idle" as const,
    lastSavedAt: null,
    retryCount: 0,
    retry: vi.fn(),
    flush: vi.fn(),
  }),
  getLocalDraft: () => null,
}));

vi.mock("@/lib/queries/scoring", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/queries/scoring")
  >("@/lib/queries/scoring");
  return {
    ...actual,
    useScores: () => ({
      data: [],
      isLoading: false,
      isFetching: false,
    }),
    useInstitutions: () => ({
      data: [],
      isLoading: false,
    }),
  };
});

import Curriculo from "./Curriculo";

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Curriculo />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue({
    user: { id: "u1", email: "lucas@medway.com" },
    profile: { name: "Lucas", role: "student" },
  });
});

describe("Curriculo page", () => {
  it("renderiza header com microcopy", () => {
    renderWithProviders();
    expect(screen.getByText("Meu Currículo")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Preencha no seu tempo. Tudo é salvo automaticamente.",
      ),
    ).toBeInTheDocument();
  });

  it("AutosaveIndicator silencioso no status idle (sem pisca-pisca)", () => {
    renderWithProviders();
    expect(screen.queryByText("Salvo")).not.toBeInTheDocument();
    expect(screen.queryByText("Salvando...")).not.toBeInTheDocument();
  });

  it("renderiza seções do accordion", () => {
    renderWithProviders();
    expect(screen.getAllByText(/Pesquisa e Publicações/).length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza CTA 'Ver detalhamento por instituição'", () => {
    renderWithProviders();
    expect(
      screen.getByRole("button", { name: /Ver detalhamento por instituição/ }),
    ).toBeInTheDocument();
  });

  it("renderiza campo numérico na seção expandida", () => {
    renderWithProviders();
    const trigger = screen.getByRole("button", { name: /Pesquisa e Publicações/ });
    fireEvent.click(trigger);
    expect(screen.getAllByText("Artigo 1º autor (FI)").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza sidebar de notas por instituição", () => {
    renderWithProviders();
    expect(screen.getByText("Sua nota nas instituições")).toBeInTheDocument();
  });
});
