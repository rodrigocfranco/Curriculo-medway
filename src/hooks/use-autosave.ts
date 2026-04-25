import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

interface UseAutosaveOptions<T> {
  data: T;
  saveFn: (data: T) => Promise<void>;
  debounceMs?: number;
  storageKey?: string;
  onError?: (error: unknown) => void;
  // Estado conhecido do servidor. Quando `data` é igual a `serverState`,
  // o hook trata como hidratação (não salva) — evita upsert redundante quando
  // o form é populado com dados recém-buscados do servidor.
  serverState?: T;
}

interface UseAutosaveReturn {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  retryCount: number;
  retry: () => void;
  flush: () => Promise<void>;
}

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

export function useAutosave<T>({
  data,
  saveFn,
  debounceMs = 500,
  storageKey,
  onError,
  serverState,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const dataRef = useRef(data);
  const saveFnRef = useRef(saveFn);
  const onErrorRef = useRef(onError);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSavingRef = useRef(false);
  // P1: track whether a save was requested while another was in flight
  const pendingSaveRef = useRef(false);
  // Track last known data snapshot to detect real changes
  const lastSerializedRef = useRef<string>(JSON.stringify(data));
  // Snapshot serializado do estado do servidor (atualizado a cada render)
  const serverSerializedRef = useRef<string | undefined>(
    serverState !== undefined ? JSON.stringify(serverState) : undefined,
  );
  serverSerializedRef.current =
    serverState !== undefined ? JSON.stringify(serverState) : undefined;
  // P3: resolve function for awaitable flush
  const flushResolveRef = useRef<(() => void) | null>(null);

  // Keep refs in sync
  dataRef.current = data;
  saveFnRef.current = saveFn;
  onErrorRef.current = onError;

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      if (!isMountedRef.current) return;
      if (status === "offline") {
        setStatus("idle");
      }
    };

    const handleOffline = () => {
      if (!isMountedRef.current) return;
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status]);

  // Persist to localStorage as fallback
  const persistToLocalStorage = useCallback(
    (value: T) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data: value, timestamp: new Date().toISOString() }),
        );
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    },
    [storageKey],
  );

  const clearLocalStorage = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // silently ignore
    }
  }, [storageKey]);

  // Core save function with retry logic
  const executeSave = useCallback(
    async (currentRetry = 0) => {
      if (!isMountedRef.current) {
        // P3: resolve flush promise even on unmount
        flushResolveRef.current?.();
        flushResolveRef.current = null;
        return;
      }
      if (!navigator.onLine) {
        setStatus("offline");
        persistToLocalStorage(dataRef.current);
        flushResolveRef.current?.();
        flushResolveRef.current = null;
        return;
      }

      isSavingRef.current = true;
      pendingSaveRef.current = false;
      setStatus("saving");
      persistToLocalStorage(dataRef.current);

      try {
        await saveFnRef.current(dataRef.current);
        if (!isMountedRef.current) {
          flushResolveRef.current?.();
          flushResolveRef.current = null;
          return;
        }
        isSavingRef.current = false;
        // Update snapshot after successful save
        lastSerializedRef.current = JSON.stringify(dataRef.current);
        setStatus("saved");
        setLastSavedAt(new Date());
        setRetryCount(0);
        clearLocalStorage();
        flushResolveRef.current?.();
        flushResolveRef.current = null;

        // P1: if data changed while we were saving, re-trigger
        const currentSerialized = JSON.stringify(dataRef.current);
        if (
          currentSerialized !== lastSerializedRef.current ||
          pendingSaveRef.current
        ) {
          pendingSaveRef.current = false;
          executeSave(0);
        }
      } catch (err) {
        if (!isMountedRef.current) {
          flushResolveRef.current?.();
          flushResolveRef.current = null;
          return;
        }
        isSavingRef.current = false;

        if (currentRetry < MAX_RETRIES - 1) {
          setRetryCount(currentRetry + 1);
          setStatus("saving");
          retryTimerRef.current = setTimeout(() => {
            executeSave(currentRetry + 1);
          }, BACKOFF_MS[currentRetry]);
        } else {
          setRetryCount(MAX_RETRIES);
          setStatus("error");
          persistToLocalStorage(dataRef.current);
          onErrorRef.current?.(err);
          flushResolveRef.current?.();
          flushResolveRef.current = null;
        }
      }
    },
    [persistToLocalStorage, clearLocalStorage],
  );

  // Debounced save trigger
  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!isSavingRef.current) {
        executeSave(0);
      } else {
        // P1: mark that a save is pending so it runs after current save completes
        pendingSaveRef.current = true;
      }
    }, debounceMs);
  }, [debounceMs, executeSave]);

  // Watch for data changes — only schedule save when data actually differs
  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSerializedRef.current) return;
    // Hidratação do servidor: data === estado conhecido do servidor → não salva
    if (
      serverSerializedRef.current !== undefined &&
      serialized === serverSerializedRef.current
    ) {
      lastSerializedRef.current = serialized;
      return;
    }
    scheduleSave();
  }, [data, scheduleSave]);

  // P3: Flush returns a Promise that resolves when save completes
  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Only save if data actually changed
    const serialized = JSON.stringify(dataRef.current);
    if (serialized === lastSerializedRef.current) return;
    if (!isSavingRef.current) {
      const promise = new Promise<void>((resolve) => {
        flushResolveRef.current = resolve;
      });
      executeSave(0);
      await promise;
    } else {
      // A save is in flight — mark pending so it re-triggers after
      pendingSaveRef.current = true;
    }
  }, [executeSave]);

  // Manual retry
  const retry = useCallback(() => {
    setRetryCount(0);
    executeSave(0);
  }, [executeSave]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  return { status, lastSavedAt, retryCount, retry, flush };
}

// ---------------------------------------------------------------------------
// localStorage draft helpers (for page initialization)
// ---------------------------------------------------------------------------

export interface LocalDraft<T> {
  data: T;
  timestamp: string;
}

export function getLocalDraft<T>(storageKey: string): LocalDraft<T> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraft<T>;
  } catch {
    return null;
  }
}
