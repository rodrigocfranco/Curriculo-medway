import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

import GlobalErrorFallback from "./GlobalErrorFallback";

function isChunkLoadError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.name === "ChunkLoadError") return true;
    if (/Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/i.test(err.message)) {
      return true;
    }
  }
  return false;
}

const RELOAD_KEY = "chunk-reload-count";
const MAX_RELOADS = 2;

export const ChunkLoadErrorFallback = () => {
  const error = useRouteError();
  const isChunk = isChunkLoadError(error);

  const reloadCount = isChunk
    ? parseInt(sessionStorage.getItem(RELOAD_KEY) ?? "0", 10)
    : 0;
  const canReload = isChunk && reloadCount < MAX_RELOADS;

  useEffect(() => {
    if (!canReload) return;
    sessionStorage.setItem(RELOAD_KEY, String(reloadCount + 1));
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [canReload, reloadCount]);

  if (isChunk) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 text-center font-sans text-foreground"
      >
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">
            Nova versão disponível
          </h1>
          {canReload ? (
            <p className="text-sm text-muted-foreground">Recarregando…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar a nova versão automaticamente.
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(RELOAD_KEY);
                  window.location.reload();
                }}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Tentar novamente
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <GlobalErrorFallback />;
};

export default ChunkLoadErrorFallback;
