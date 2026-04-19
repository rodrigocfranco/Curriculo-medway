import { Progress } from "@/components/ui/progress";
import { toGrade, formatGrade } from "@/lib/schemas/scoring";

interface ScoreHeroProps {
  score: number;
  maxScore: number;
  institutionName: string;
}

function getMicrocopy(grade: number): string {
  if (grade >= 7.5) return "Ótima posição nesta instituição!";
  if (grade >= 5.0) return "Bom caminho — veja onde pode crescer";
  return "Espaço para crescer — veja as oportunidades abaixo";
}

export function ScoreHero({ score, maxScore, institutionName }: ScoreHeroProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const grade = toGrade(score, maxScore);
  const gradeFormatted = formatGrade(score, maxScore);
  const microcopy = getMicrocopy(grade);

  return (
    <div
      className="flex items-center gap-6 rounded-xl bg-muted/30 px-6 py-4"
      aria-label={`Nota ${gradeFormatted} em ${institutionName}, ${score} de ${maxScore} pontos`}
      role="region"
    >
      {/* Nota grande */}
      <p className="text-5xl font-bold tabular-nums sm:text-6xl">
        {gradeFormatted}
      </p>

      {/* Info + barra */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {score} / {maxScore} pontos
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2 bg-primary/10 [&>div]:bg-accent"
        />
        <p className="text-xs text-muted-foreground">{microcopy}</p>
      </div>
    </div>
  );
}
