import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/queries/leads", () => ({
  useLeadMetrics: () => ({
    data: {
      total: 150,
      last7days: 12,
      last30days: 45,
      withCurriculum: 80,
      withoutCurriculum: 70,
    },
    isLoading: false,
  }),
  useLeads: () => ({
    data: {
      data: [
        {
          id: "lead-1",
          name: "Maria Silva",
          email: "maria@test.com",
          phone: "(11) 99999-0000",
          state: "SP",
          university: "USP",
          graduation_year: 2026,
          specialty_interest: "Cardiologia",
          created_at: "2026-04-01T10:00:00Z",
        },
      ],
      totalCount: 1,
    },
    isLoading: false,
  }),
  useLeadDetail: () => ({
    data: null,
    isLoading: false,
  }),
}));

const mockInvoke = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import Leads from "./Leads";

function renderWithProviders() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/leads"]}>
        <Leads />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Leads page", () => {
  it("renderiza heading Leads", () => {
    renderWithProviders();
    expect(screen.getByRole("heading", { name: "Leads" })).toBeInTheDocument();
  });

  it("exibe cards de métricas", () => {
    renderWithProviders();
    expect(screen.getByText("Total de leads")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Últimos 7 dias")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("exibe dados da tabela", () => {
    renderWithProviders();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("maria@test.com")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
  });

  it("tabela tem headers com scope=col", () => {
    renderWithProviders();
    const headers = document.querySelectorAll("th[scope='col']");
    expect(headers.length).toBeGreaterThan(0);
  });

  it("tabela tem aria-sort nos headers", () => {
    renderWithProviders();
    const headersWithSort = document.querySelectorAll("th[aria-sort]");
    expect(headersWithSort.length).toBeGreaterThan(0);
  });

  it("linhas da tabela são clicáveis via teclado (role=button + tabindex)", () => {
    renderWithProviders();
    const rows = document.querySelectorAll("tbody tr[role='button']");
    expect(rows.length).toBe(1);
    expect(rows[0].getAttribute("tabindex")).toBe("0");
  });

  it("exibe filtros", () => {
    renderWithProviders();
    expect(screen.getByLabelText("De")).toBeInTheDocument();
    expect(screen.getByLabelText("Até")).toBeInTheDocument();
  });

  it("renderiza botões de export CSV e Hubspot", () => {
    renderWithProviders();
    expect(screen.getByRole("button", { name: /exportar csv/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar para hubspot/i })).toBeInTheDocument();
  });

  it("invoca supabase.functions.invoke com formato csv ao clicar Exportar CSV", async () => {
    mockInvoke.mockResolvedValueOnce({ data: new Blob(["csv-data"], { type: "text/csv" }), error: null });

    renderWithProviders();
    const btn = screen.getByRole("button", { name: /exportar csv/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("export-leads", {
        body: expect.objectContaining({ format: "csv" }),
      });
    });
  });

  it("invoca supabase.functions.invoke com formato hubspot ao clicar Exportar para Hubspot", async () => {
    mockInvoke.mockResolvedValueOnce({ data: new Blob(["csv-data"], { type: "text/csv" }), error: null });

    renderWithProviders();
    const btn = screen.getByRole("button", { name: /exportar para hubspot/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("export-leads", {
        body: expect.objectContaining({ format: "hubspot" }),
      });
    });
  });

  it("mostra toast informativo quando 0 leads", async () => {
    const { toast: toastMock } = await import("sonner");
    mockInvoke.mockResolvedValueOnce({ data: { count: 0 }, error: null });

    renderWithProviders();
    const btn = screen.getByRole("button", { name: /exportar csv/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(toastMock.info).toHaveBeenCalledWith("Nenhum lead encontrado com os filtros atuais");
    });
  });

  it("mostra toast de erro quando export falha", async () => {
    const { toast: toastMock } = await import("sonner");
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error("fail") });

    renderWithProviders();
    const btn = screen.getByRole("button", { name: /exportar csv/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Erro ao exportar leads. Tente novamente.");
    });
  });
});
