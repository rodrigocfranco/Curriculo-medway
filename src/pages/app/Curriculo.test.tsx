import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useAuthMock = vi.fn();

vi.mock("@/contexts/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const mockFieldsByCategory = {
  Publicações: [
    {
      id: "1",
      field_key: "artigo_1_fi",
      label: "Artigo 1º autor (FI)",
      field_type: "number",
      category: "Publicações",
      display_order: 10,
      options: null,
      created_at: "",
    },
  ],
  Acadêmico: [
    {
      id: "2",
      field_key: "ic_com_bolsa",
      label: "IC com bolsa (anos)",
      field_type: "number",
      category: "Acadêmico",
      display_order: 10,
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

  it("renderiza AutosaveIndicator com status idle", () => {
    renderWithProviders();
    expect(screen.getByText("Salvo")).toBeInTheDocument();
  });

  it("renderiza seções do accordion", () => {
    renderWithProviders();
    expect(screen.getAllByText("Publicações").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Acadêmico").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza CTA 'Ver meus resultados'", () => {
    renderWithProviders();
    expect(
      screen.getByRole("button", { name: /Ver meus resultados/ }),
    ).toBeInTheDocument();
  });

  it("renderiza campo numérico na seção expandida", () => {
    renderWithProviders();
    expect(screen.getAllByText("Artigo 1º autor (FI)").length).toBeGreaterThanOrEqual(1);
  });
});
