import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

type AuthCallback = (event: string, session: unknown) => void;

const listeners: AuthCallback[] = [];
const unsubscribeMock = vi.fn();
const getSessionMock = vi.fn();
const signOutMock = vi.fn<(...args: unknown[]) => Promise<{ error: null }>>(
  () => Promise.resolve({ error: null }),
);
const singleMock = vi.fn();
const removeQueriesSpy = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
      signOut: (...args: unknown[]) => signOutMock(...args),
      onAuthStateChange: (cb: AuthCallback) => {
        listeners.push(cb);
        return {
          data: { subscription: { unsubscribe: unsubscribeMock } },
        };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => singleMock() }),
      }),
    }),
  },
}));

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const originalRemove = client.removeQueries.bind(client);
  client.removeQueries = ((filters?: unknown) => {
    removeQueriesSpy(filters);
    return originalRemove(filters as Parameters<typeof originalRemove>[0]);
  }) as typeof client.removeQueries;
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

function Probe() {
  const { user, profile, loading, recoveryMode } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user?.id ?? "none"}</div>
      <div data-testid="profile">{profile?.role ?? "none"}</div>
      <div data-testid="recovery">{String(recoveryMode)}</div>
    </div>
  );
}

beforeEach(() => {
  listeners.length = 0;
  unsubscribeMock.mockReset();
  signOutMock.mockClear();
  singleMock.mockReset();
  getSessionMock.mockReset();
  removeQueriesSpy.mockReset();
});

describe("AuthContext", () => {
  it("loading=true até getSession resolver", async () => {
    let resolveSession: (value: { data: { session: null } }) => void = () => {};
    getSessionMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );

    render(<Probe />, { wrapper: makeWrapper() });

    expect(screen.getByTestId("loading").textContent).toBe("true");

    await act(async () => {
      resolveSession({ data: { session: null } });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("evento SIGNED_IN atualiza user e dispara fetch de profile", async () => {
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });
    singleMock.mockResolvedValueOnce({
      data: {
        id: "u1",
        role: "admin",
        name: "Lucas",
        email: "lucas@example.com",
        phone: null,
        state: null,
        university: null,
        graduation_year: null,
        specialty_interest: null,
        created_at: "2026-04-14T00:00:00Z",
        updated_at: "2026-04-14T00:00:00Z",
      },
      error: null,
    });

    render(<Probe />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      listeners[0]("SIGNED_IN", {
        access_token: "tok",
        refresh_token: "ref",
        user: { id: "u1", email: "lucas@example.com" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u1");
    });
    await waitFor(() => {
      expect(screen.getByTestId("profile").textContent).toBe("admin");
    });
  });

  it("SIGNED_OUT reseta user e invoca removeQueries em ['profile']", async () => {
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          access_token: "tok",
          refresh_token: "ref",
          user: { id: "u1", email: "lucas@example.com" },
        },
      },
    });
    singleMock.mockResolvedValue({
      data: {
        id: "u1",
        role: "student",
        name: "Lucas",
        email: "lucas@example.com",
        phone: null,
        state: null,
        university: null,
        graduation_year: null,
        specialty_interest: null,
        created_at: "2026-04-14T00:00:00Z",
        updated_at: "2026-04-14T00:00:00Z",
      },
      error: null,
    });

    render(<Probe />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u1");
    });

    await act(async () => {
      listeners[0]("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("none");
    });
    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ["profile"] });
  });

  it("PASSWORD_RECOVERY marca recoveryMode=true e popula user", async () => {
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });
    singleMock.mockResolvedValue({
      data: {
        id: "u1",
        role: "student",
        name: "Lucas",
        email: "lucas@example.com",
        phone: null,
        state: null,
        university: null,
        graduation_year: null,
        specialty_interest: null,
        created_at: "2026-04-14T00:00:00Z",
        updated_at: "2026-04-14T00:00:00Z",
      },
      error: null,
    });

    render(<Probe />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      listeners[0]("PASSWORD_RECOVERY", {
        access_token: "tok",
        refresh_token: "ref",
        user: { id: "u1", email: "lucas@example.com" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("u1");
    });
    expect(screen.getByTestId("recovery").textContent).toBe("true");

    await act(async () => {
      listeners[0]("USER_UPDATED", {
        access_token: "tok",
        refresh_token: "ref",
        user: { id: "u1", email: "lucas@example.com" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("recovery").textContent).toBe("false");
    });
  });

  it("SIGNED_OUT durante recovery limpa recoveryMode", async () => {
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });
    render(<Probe />, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    await act(async () => {
      listeners[0]("PASSWORD_RECOVERY", {
        access_token: "tok",
        refresh_token: "ref",
        user: { id: "u1", email: "lucas@example.com" },
      });
    });
    expect(screen.getByTestId("recovery").textContent).toBe("true");

    await act(async () => {
      listeners[0]("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("recovery").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("useAuth fora de provider lança erro", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      /useAuth deve ser usado dentro de <AuthProvider>/,
    );
    err.mockRestore();
  });
});
