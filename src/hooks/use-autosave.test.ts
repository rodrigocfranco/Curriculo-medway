import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosave, getLocalDraft } from "./use-autosave";

// localStorage mock for jsdom
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageStore[key];
  },
  clear: () => {
    for (const key of Object.keys(localStorageStore)) {
      delete localStorageStore[key];
    }
  },
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    // Ensure navigator.onLine is true
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("inicia com status idle", () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ data: { a: 1 }, saveFn }),
    );
    expect(result.current.status).toBe("idle");
    expect(result.current.lastSavedAt).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it("debounce: não salva imediatamente após mudança", () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 500 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });
    expect(saveFn).not.toHaveBeenCalled();
  });

  it("debounce: salva após debounceMs", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 500 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it("flush: salva imediatamente ignorando debounce", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 500 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    await act(async () => {
      result.current.flush();
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
  });

  it("retry: tenta novamente após falha com backoff", async () => {
    let callCount = 0;
    const saveFn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 2) throw new Error("Network error");
    });

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 100 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    // Trigger debounce → 1st call (fails)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(saveFn).toHaveBeenCalledTimes(1);

    // 1st retry after 1000ms
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(saveFn).toHaveBeenCalledTimes(2);

    // 2nd retry after 2000ms (succeeds)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(saveFn).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("saved");
  });

  it("error: mostra status error após 3 falhas", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("fail"));

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 100 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    // 1st attempt
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    // 2nd attempt (backoff 1s)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // 3rd attempt (backoff 2s)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(saveFn).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("error");
    expect(result.current.retryCount).toBe(3);
  });

  it("localStorage: persiste draft em cada save e limpa após sucesso", async () => {
    const storageKey = "curriculum-draft-test";
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) =>
        useAutosave({ data, saveFn, debounceMs: 100, storageKey }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // After successful save, localStorage should be cleared
    expect(localStorageMock.getItem(storageKey)).toBeNull();
  });

  it("localStorage: mantém draft após falha", async () => {
    const storageKey = "curriculum-draft-fail";
    const saveFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { rerender } = renderHook(
      ({ data }) =>
        useAutosave({ data, saveFn, debounceMs: 100, storageKey }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const draft = localStorageMock.getItem(storageKey);
    expect(draft).not.toBeNull();
    const parsed = JSON.parse(draft!);
    expect(parsed.data).toEqual({ a: 2 });
    expect(parsed.timestamp).toBeDefined();
  });

  it("manual retry: resets retryCount e tenta novamente", async () => {
    let shouldFail = true;
    const saveFn = vi.fn().mockImplementation(async () => {
      if (shouldFail) throw new Error("fail");
    });

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ data, saveFn, debounceMs: 100 }),
      { initialProps: { data: { a: 1 } } },
    );

    rerender({ data: { a: 2 } });

    // Exhaust all retries
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.status).toBe("error");

    // Now fix the problem and retry manually
    shouldFail = false;
    await act(async () => {
      result.current.retry();
    });
    expect(result.current.status).toBe("saved");
  });

  it("serverState: não salva quando data hidrata para o estado do servidor", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    type Form = { a: number };
    const { rerender } = renderHook(
      ({ data, serverState }: { data: Form; serverState?: Form }) =>
        useAutosave({ data, saveFn, debounceMs: 100, serverState }),
      { initialProps: { data: { a: 0 }, serverState: undefined } },
    );

    // Servidor responde com {a:1} e form é resetado para o mesmo valor
    rerender({ data: { a: 1 }, serverState: { a: 1 } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(saveFn).not.toHaveBeenCalled();

    // Usuário edita: agora data difere de serverState — save deve ocorrer
    rerender({ data: { a: 2 }, serverState: { a: 1 } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it("serverState: salva quando data difere do servidor (caso localDraft mais novo)", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    type Form = { a: number };
    const { rerender } = renderHook(
      ({ data, serverState }: { data: Form; serverState?: Form }) =>
        useAutosave({ data, saveFn, debounceMs: 100, serverState }),
      { initialProps: { data: { a: 0 }, serverState: undefined } },
    );

    // Server tem {a:1}, mas localDraft tem {a:5} — form hidrata com draft
    rerender({ data: { a: 5 }, serverState: { a: 1 } });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
  });

  it("offline: detecta status offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({ data: { a: 1 }, saveFn }),
    );

    expect(result.current.status).toBe("offline");
  });
});

describe("getLocalDraft", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("retorna null quando não há draft", () => {
    expect(getLocalDraft("nonexistent")).toBeNull();
  });

  it("retorna draft salvo com dados e timestamp", () => {
    const draft = { data: { a: 1 }, timestamp: "2026-01-01T00:00:00.000Z" };
    localStorageMock.setItem("test-key", JSON.stringify(draft));
    const result = getLocalDraft("test-key");
    expect(result).toEqual(draft);
  });

  it("retorna null para JSON inválido", () => {
    localStorageMock.setItem("broken", "not-json");
    expect(getLocalDraft("broken")).toBeNull();
  });
});
