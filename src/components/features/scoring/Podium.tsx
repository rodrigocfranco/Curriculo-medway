import { Trophy, Medal, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Institution, UserScore } from "@/lib/schemas/scoring";
import { formatGrade } from "@/lib/schemas/scoring";

export interface PodiumEntry {
  institution: Institution;
  score: UserScore;
}

interface PodiumProps {
  entries: PodiumEntry[];
  onCardClick: (institutionId: string) => void;
  onEmptyClick?: () => void;
}

interface PositionConfig {
  position: 1 | 2 | 3;
  label: string;
  Icon: typeof Trophy;
  iconColor: string;
  bgGradient: string;
  borderColor: string;
  height: string;
  desktopOrder: string;
}

const POSITIONS: Record<1 | 2 | 3, PositionConfig> = {
  1: {
    position: 1,
    label: "1º lugar",
    Icon: Trophy,
    iconColor: "text-amber-500",
    bgGradient: "bg-gradient-to-b from-amber-50 to-amber-100/50",
    borderColor: "border-amber-300",
    height: "md:min-h-[15rem]",
    desktopOrder: "md:order-2",
  },
  2: {
    position: 2,
    label: "2º lugar",
    Icon: Medal,
    iconColor: "text-slate-400",
    bgGradient: "bg-gradient-to-b from-slate-50 to-slate-100/50",
    borderColor: "border-slate-300",
    height: "md:min-h-[12rem]",
    desktopOrder: "md:order-1",
  },
  3: {
    position: 3,
    label: "3º lugar",
    Icon: Award,
    iconColor: "text-orange-500",
    bgGradient: "bg-gradient-to-b from-orange-50 to-orange-100/40",
    borderColor: "border-orange-300",
    height: "md:min-h-[10rem]",
    desktopOrder: "md:order-3",
  },
};

function PodiumCard({
  entry,
  config,
  onCardClick,
}: {
  entry: PodiumEntry;
  config: PositionConfig;
  onCardClick: (institutionId: string) => void;
}) {
  const { institution, score } = entry;
  const displayName = institution.short_name || institution.name;
  const grade = formatGrade(score.score, score.max_score);
  const { Icon, label, iconColor, bgGradient, borderColor, height, desktopOrder } = config;

  const handle = () => onCardClick(institution.id);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${displayName}, nota ${grade}, ver detalhes`}
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle();
        }
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center gap-2 border-2 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${bgGradient} ${borderColor} ${height} ${desktopOrder}`}
    >
      <Icon className={`h-9 w-9 ${iconColor}`} aria-hidden />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <h3 className="line-clamp-2 text-center text-base font-semibold leading-tight">
        {displayName}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums">{grade}</span>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {score.score} / {score.max_score} pts
      </span>
    </Card>
  );
}

function PodiumEmptyState({ onEmptyClick }: { onEmptyClick?: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed bg-muted/20 p-10 text-center">
      <Trophy className="h-12 w-12 text-muted-foreground/40" aria-hidden />
      <p className="max-w-md text-sm text-muted-foreground">
        Preencha seu currículo para ver suas top 3 instituições no pódio.
      </p>
      {onEmptyClick && (
        <Button size="sm" onClick={onEmptyClick}>
          Preencher currículo
        </Button>
      )}
    </Card>
  );
}

export function Podium({ entries, onCardClick, onEmptyClick }: PodiumProps) {
  if (entries.length === 0) {
    return <PodiumEmptyState onEmptyClick={onEmptyClick} />;
  }

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-end md:gap-6">
      {entries.slice(0, 3).map((entry, idx) => {
        const position = (idx + 1) as 1 | 2 | 3;
        return (
          <PodiumCard
            key={entry.institution.id}
            entry={entry}
            config={POSITIONS[position]}
            onCardClick={onCardClick}
          />
        );
      })}
    </div>
  );
}
