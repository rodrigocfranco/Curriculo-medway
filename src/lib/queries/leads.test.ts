import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useLeadMetrics, useLeads, useLeadDetail } from "./leads";

// --- Supabase mock ---

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn();
const mockNot = vi.fn();
const mockIn = vi.fn();

function buildChain() {
  const chain: Record<string, unknown> = {
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
    limit: mockLimit,
    not: mockNot,
    in: mockIn,
  };
  // Each mock returns the chain for chaining
  for (const fn of [mockSelect, mockEq, mockGte, mockOrder, mockRange, mockNot, mockIn]) {
    fn.mockReturnValue(chain);
  }
  return chain;
}

const chain = buildChain();
const mockFrom = vi.fn((_table: string) => chain);

vi.mock("../supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  buildChain();
});

describe("useLeadMetrics", () => {
  it("returns metrics on success", async () => {
    // Total query
    mockSelect.mockImplementation((_sel: unknown, opts?: { count?: string; head?: boolean }) => {
      if (opts?.head) {
        return {
          ...chain,
          eq: vi.fn().mockReturnValue({
            ...chain,
            gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
            error: null,
            count: 10,
          }),
          error: null,
          count: 10,
        };
      }
      return chain;
    });

    // Simplified: mock all from calls to resolve with count
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: callCount <= 1 ? 10 : 3, error: null }),
            error: null,
            count: 10,
          }),
          error: null,
          count: callCount <= 3 ? 2 : 10,
        }),
      };
      return mockChain;
    });

    const { result } = renderHook(() => useLeadMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(typeof result.current.data?.total).toBe("number");
  });
});

describe("useLeads", () => {
  it("returns paginated leads on success", async () => {
    const mockLeads = [
      {
        id: "1",
        name: "Test Lead",
        email: "test@test.com",
        phone: null,
        state: "SP",
        university: "USP",
        graduation_year: 2026,
        specialty_interest: "Cardiologia",
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockLeads,
              error: null,
              count: 1,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(
      () => useLeads({}, 0, 50, [{ id: "created_at", desc: true }]),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe("Test Lead");
    expect(result.current.data?.totalCount).toBe(1);
  });
});

describe("useLeadDetail", () => {
  it("is disabled when userId is null", () => {
    const { result } = renderHook(() => useLeadDetail(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches detail when userId is provided", async () => {
    const mockProfile = {
      id: "u1",
      name: "Detail Lead",
      email: "detail@test.com",
      phone: null,
      state: "SP",
      university: "USP",
      graduation_year: 2026,
      specialty_interest: "Dermatologia",
      role: "student",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    let fromCall = 0;
    mockFrom.mockImplementation(() => {
      fromCall++;
      if (fromCall === 1) {
        // profiles
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            }),
          }),
        };
      }
      if (fromCall === 2) {
        // user_curriculum
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      // user_scores
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    });

    const { result } = renderHook(() => useLeadDetail("u1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.profile.name).toBe("Detail Lead");
    expect(result.current.data?.curriculum).toBeNull();
    expect(result.current.data?.topScores).toHaveLength(0);
  });
});
