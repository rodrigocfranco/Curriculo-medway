import { useMemo } from "react";
import type { UserScore, Institution } from "@/lib/schemas/scoring";
import { formatGrade } from "@/lib/schemas/scoring";

interface NarrativeBannerProps {
  scores: UserScore[];
  institutions: Institution[];
}

export function NarrativeBanner({ scores, institutions }: NarrativeBannerProps) {
  const narrative = useMemo(() => {
    const validScores = scores.filter((s) => s.score > 0);

    if (validScores.length === 0) {
      return "Preencha seu currículo para ver onde você se destaca.";
    }

    const instMap = new Map(institutions.map((i) => [i.id, i]));

    // Top = highest grade (sorted desc by useScores — raw score, but grade preserves order)
    const topScore = validScores[0];
    const topInst = instMap.get(topScore.institution_id);
    const topName = topInst?.short_name || topInst?.name || "—";
    const topGrade = formatGrade(topScore.score, topScore.max_score);

    // Oportunidade = institution with lowest grade (most room to grow)
    let bestOppInst: Institution | undefined;
    let bestOppGrade = "10,0";
    let bestOppLowestGradeNum = 10;
    let bestOppCategory = "";

    for (const s of validScores) {
      const gradeNum = s.max_score > 0 ? (s.score / s.max_score) * 10 : 0;
      if (gradeNum < bestOppLowestGradeNum) {
        bestOppLowestGradeNum = gradeNum;
        bestOppGrade = formatGrade(s.score, s.max_score);
        bestOppInst = instMap.get(s.institution_id);

        // Find top gap category within this institution
        let maxCatDelta = 0;
        for (const [key, item] of Object.entries(s.breakdown)) {
          const catDelta = item.max - item.score;
          if (catDelta > maxCatDelta) {
            maxCatDelta = catDelta;
            bestOppCategory = item.label || item.description || key;
          }
        }
      }
    }

    const oppName = bestOppInst?.short_name || bestOppInst?.name || "—";

    if (!bestOppCategory) {
      return `Você está mais competitivo em ${topName} (nota ${topGrade}). Maior oportunidade: ${oppName} (nota ${bestOppGrade}).`;
    }

    return `Você está mais competitivo em ${topName} (nota ${topGrade}). Maior oportunidade: ${oppName} (nota ${bestOppGrade}), ${bestOppCategory}.`;
  }, [scores, institutions]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
      <span className="text-lg" role="img" aria-hidden="true">
        🧭
      </span>
      <p className="text-sm text-foreground">{narrative}</p>
    </div>
  );
}
