import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserScore, Institution } from "@/lib/schemas/scoring";
import { formatGrade } from "@/lib/schemas/scoring";

interface ScoreCardProps {
  institution: Institution;
  score: UserScore | null;
  onClick: () => void;
  onEmptyClick?: () => void;
}

function isPartialScore(score: UserScore): boolean {
  const entries = Object.values(score.breakdown);
  if (entries.length === 0) return false;
  const filledCount = entries.filter((item) => item.score > 0).length;
  return filledCount > 0 && filledCount < entries.length * 0.5;
}

function isEmptyScore(score: UserScore | null): boolean {
  if (!score) return true;
  const entries = Object.values(score.breakdown);
  return entries.length === 0;
}

export function ScoreCard({ institution, score, onClick, onEmptyClick }: ScoreCardProps) {
  const empty = isEmptyScore(score);
  const partial = !empty && score !== null && isPartialScore(score);

  const displayName = institution.short_name || institution.name;
  const scoreValue = score?.score ?? 0;
  const maxScore = score?.max_score ?? 0;
  const gradeFormatted = formatGrade(scoreValue, maxScore);

  const emptyHandler = onEmptyClick ?? onClick;

  if (empty) {
    return (
      <Card
        className="group flex cursor-pointer items-center justify-between px-5 py-4 transition-shadow hover:border-accent/50 hover:shadow-md"
        role="button"
        tabIndex={0}
        aria-label={`${displayName}, sem score, preencher currículo`}
        onClick={emptyHandler}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            emptyHandler();
          }
        }}
      >
        <h3 className="text-sm font-semibold">{displayName}</h3>
        <Button variant="link" className="h-auto p-0 text-xs text-accent" tabIndex={-1}>
          Preencher
        </Button>
      </Card>
    );
  }

  return (
    <Card
      className="group flex cursor-pointer items-center justify-between px-5 py-4 transition-shadow hover:border-accent/50 hover:shadow-md"
      role="button"
      tabIndex={0}
      aria-label={`${displayName}, nota ${gradeFormatted}, ver detalhes`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{displayName}</h3>
        {partial && <Badge variant="secondary" className="text-[10px]">Parcial</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold tabular-nums">{gradeFormatted}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
      </div>
    </Card>
  );
}
