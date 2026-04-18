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
      className="space-y-3"
      aria-label={`Nota ${gradeFormatted} em ${institutionName}, ${score} de ${maxScore} pontos`}
      role="region"
    >
      <div>
        <p className="text-[96px] font-bold leading-none tabular-nums">
          {gradeFormatted}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {score} / {maxScore} pontos
        </p>
      </div>
      <Progress
        value={percentage}
        className="h-3 bg-primary/20 [&>div]:bg-accent"
      />
      <p className="text-sm text-muted-foreground">{microcopy}</p>
    </div>
  );
}
