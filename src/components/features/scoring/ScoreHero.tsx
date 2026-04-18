import { Progress } from "@/components/ui/progress";

interface ScoreHeroProps {
  score: number;
  maxScore: number;
  institutionName: string;
}

function getMicrocopy(score: number, maxScore: number): string {
  if (maxScore === 0) return "";
  const pct = (score / maxScore) * 100;
  if (pct >= 75) return "Ótima posição nesta instituição!";
  if (pct >= 50) return "Bom caminho — veja onde pode crescer";
  return `Você tem ${maxScore - score} pontos possíveis para crescer aqui`;
}

export function ScoreHero({ score, maxScore, institutionName }: ScoreHeroProps) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const microcopy = getMicrocopy(score, maxScore);

  return (
    <div
      className="space-y-3"
      aria-label={`Score ${score} de ${maxScore} em ${institutionName}`}
      role="region"
    >
      <p className="text-[96px] font-bold leading-none tabular-nums">
        {score}
        <span className="text-3xl font-normal text-muted-foreground">
          {" "}/ {maxScore}
        </span>
      </p>
      <Progress
        value={percentage}
        className="h-3 bg-primary/20 [&>div]:bg-accent"
      />
      {microcopy && (
        <p className="text-sm text-muted-foreground">{microcopy}</p>
      )}
    </div>
  );
}
