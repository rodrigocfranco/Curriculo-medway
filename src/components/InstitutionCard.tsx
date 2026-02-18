import { InstitutionScore } from "@/lib/types";

interface Props {
  result: InstitutionScore;
}

export default function InstitutionCard({ result }: Props) {
  const pct = result.base > 0 ? (result.score / result.base) * 100 : 0;
  const isDecimal = result.base <= 10;
  const display = isDecimal ? result.score.toFixed(1) : Math.round(result.score);
  const maxDisplay = isDecimal ? result.base.toFixed(1) : result.base;

  return (
    <div className="score-card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-base text-foreground">{result.name}</h3>
        <span className="mono-score text-2xl text-primary font-bold">
          {display}<span className="text-sm text-muted-foreground font-normal">/{maxDisplay}</span>
        </span>
      </div>

      <div className="score-bar-track mb-1">
        <div
          className="score-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-1 text-right mono-score">{pct.toFixed(0)}%</p>
    </div>
  );
}
