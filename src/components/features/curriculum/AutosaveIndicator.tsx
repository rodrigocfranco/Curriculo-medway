import { Loader2, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutosaveStatus } from "@/hooks/use-autosave";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  retryCount: number;
  onRetry: () => void;
}

export function AutosaveIndicator({
  status,
  retryCount,
  onRetry,
}: AutosaveIndicatorProps) {
  // Pisca-pisca eliminado: idle/saving/saved não renderizam.
  // Sidebar de scores fornece feedback de progresso ("Atualizando…").
  // Mantém apenas estados que pedem ação do usuário: erro e offline.
  const isRetrying = status === "saving" && retryCount > 0;

  if (
    status === "idle" ||
    status === "saving" ||
    status === "saved"
  ) {
    if (!isRetrying) return null;
  }

  return (
    <div
      className="flex items-center gap-1.5 text-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {isRetrying && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
          <span className="text-amber-600">
            Erro ao salvar — tentando novamente...
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
