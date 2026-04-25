import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("./supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { resolvePostLoginRoute } from "./post-login-redirect";

beforeEach(() => {
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  maybeSingleMock.mockReset();
});

describe("resolvePostLoginRoute", () => {
  it("admin → /admin (não consulta currículo)", async () => {
    const route = await resolvePostLoginRoute("u1", "admin");
    expect(route).toBe("/admin");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("student sem linha em user_curriculum → /app/curriculo", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const route = await resolvePostLoginRoute("u1", "student");
    expect(route).toBe("/app/curriculo");
    expect(fromMock).toHaveBeenCalledWith("user_curriculum");
    expect(eqMock).toHaveBeenCalledWith("user_id", "u1");
  });

  it("student com data vazio ({}) → /app/curriculo", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { data: {} },
      error: null,
    });
    const route = await resolvePostLoginRoute("u1", "student");
    expect(route).toBe("/app/curriculo");
  });

  it("student com data preenchido → /app", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { data: { media_geral: 8, monitoria_semestres: 2 } },
      error: null,
    });
    const route = await resolvePostLoginRoute("u1", "student");
    expect(route).toBe("/app");
  });

  it("erro na consulta → fallback /app/curriculo", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "rede" },
    });
    const route = await resolvePostLoginRoute("u1", "student");
    expect(route).toBe("/app/curriculo");
  });
});
