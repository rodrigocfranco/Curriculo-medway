import { AlertTriangle } from "lucide-react";

interface DisclaimerBannerProps {
  variant?: "compact" | "full";
}

export function DisclaimerBanner({ variant = "compact" }: DisclaimerBannerProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5 rounded bg-warning/10 px-2 py-1">
        <AlertTriangle className="h-3 w-3 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Scores são estimativas baseadas em editais públicos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Os scores exibidos são estimativas baseadas em editais públicos e podem não refletir
        critérios internos das instituições. Use como referência, não como garantia.
      </p>
    </div>
  );
}
