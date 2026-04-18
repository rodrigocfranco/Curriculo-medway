import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserScore, Institution, ScoreBreakdown } from "@/lib/schemas/scoring";
import { formatGrade } from "@/lib/schemas/scoring";

interface ScoreCardProps {
  institution: Institution;
  score: UserScore | null;
  onClick: () => void;
  onEmptyClick?: () => void;
}

function getTopGap(breakdown: ScoreBreakdown): { category: string; delta: number } | null {
  let topCategory: string | null = null;
  let maxDelta = 0;

  for (const [key, item] of Object.entries(breakdown)) {
    const delta = item.max - item.score;
    if (delta > maxDelta) {
      maxDelta = delta;
      topCategory = item.description || key;
    }
  }

  if (!topCategory || maxDelta === 0) return null;
  return { category: topCategory, delta: maxDelta };
}

function isPartialScore(score: UserScore): boolean {
  const entries = Object.values(score.breakdown);
  if (entries.length === 0) return false;
  const filledCount = entries.filter((item) => item.score > 0).length;
  return filledCount > 0 && filledCount < entries.length * 0.5;
}

function isEmptyScore(score: UserScore | null): boolean {
  if (!score) return true;
  // Score existe mas breakdown vazio = nunca foi calculado de verdade
  const entries = Object.values(score.breakdown);
  return entries.length === 0;
}

export function ScoreCard({ institution, score, onClick, onEmptyClick }: ScoreCardProps) {
  const percentage = score && score.max_score > 0
    ? (score.score / score.max_score) * 100
    : 0;

  const gap = useMemo(
    () => (score ? getTopGap(score.breakdown) : null),
    [score],
  );

  const empty = isEmptyScore(score);
  const partial = !empty && score !== null && isPartialScore(score);

  const displayName = institution.short_name || institution.name;
  const scoreValue = score?.score ?? 0;
  const maxScore = score?.max_score ?? 0;
  const gradeFormatted = formatGrade(scoreValue, maxScore);

  const emptyHandler = onEmptyClick ?? onClick;

  const ariaLabel = empty
    ? `${displayName}, sem score, botão preencher currículo`
    : `${displayName}, nota ${gradeFormatted}${gap ? `, mais ${gap.delta} possíveis em ${gap.category}` : ""}, botão ver detalhes`;

  if (empty) {
    return (
      <Card
        className="group flex min-h-[180px] cursor-pointer flex-col justify-between p-5 transition-shadow hover:border-accent/50 hover:shadow-md"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={emptyHandler}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            emptyHandler();
          }
        }}
      >
        <h3 className="text-base font-semibold">{displayName}</h3>
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-sm text-muted-foreground">Sem dados ainda</p>
          <Button variant="link" className="h-auto p-0 text-accent" tabIndex={-1}>
            Comece a preencher
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="group flex min-h-[180px] cursor-pointer flex-col justify-between p-5 transition-shadow hover:border-accent/50 hover:shadow-md"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{displayName}</h3>
            {partial && <Badge variant="secondary">Parcial</Badge>}
          </div>
          <p className="mt-1 text-5xl font-bold tabular-nums">{gradeFormatted}</p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
      </div>

      <div className="mt-3 space-y-2">
        <Progress
          value={percentage}
          className="h-2 bg-primary/20 [&>div]:bg-accent"
        />
        {gap && (
          <p className="text-xs text-muted-foreground">
            +{gap.delta} em {gap.category}
          </p>
        )}
      </div>
    </Card>
  );
}
