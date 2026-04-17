import { Check, Loader2, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutosaveStatus } from "@/hooks/use-autosave";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  retryCount: number;
  onRetry: () => void;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "há poucos segundos";
  if (seconds < 60) return `há ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  return `há ${Math.floor(minutes / 60)}h`;
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  retryCount,
  onRetry,
}: AutosaveIndicatorProps) {
  // P6: during retries show "tentando novamente", after all retries show error + button
  const isRetrying = status === "saving" && retryCount > 0;

  return (
    <div
      className="flex items-center gap-1.5 text-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {status === "idle" && (
        <span className="text-muted-foreground">Salvo</span>
      )}

      {status === "saving" && !isRetrying && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Salvando...</span>
        </>
      )}

      {isRetrying && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
          <span className="text-amber-600">
            Erro ao salvar — tentando novamente...
          </span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-3.5 w-3.5 text-teal-600" />
          <span className="text-teal-600">
            Salvo {lastSavedAt ? formatTimeAgo(lastSavedAt) : ""}
          </span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-amber-600">Erro ao salvar</span>
          {/* P7: min-h-[44px] + min-w-[44px] for touch target, text-sm for 14px min */}
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] px-3 py-2 text-sm text-amber-600 underline hover:text-amber-700"
            onClick={onRetry}
          >
            Tentar de novo
          </Button>
        </>
      )}

      {status === "offline" && (
        <>
          <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Sem conexão</span>
        </>
      )}
    </div>
  );
}
