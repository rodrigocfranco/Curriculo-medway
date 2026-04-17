import { useMemo } from "react";
import type { UserScore, Institution } from "@/lib/schemas/scoring";

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

    // Top = highest score (already sorted desc by useScores)
    const topScore = validScores[0];
    const topInst = instMap.get(topScore.institution_id);
    const topName = topInst?.short_name || topInst?.name || "—";

    // Oportunidade = institution with largest total gap (max_score - score)
    let bestOppInst: Institution | undefined;
    let bestOppDelta = 0;
    let bestOppCategory = "";

    for (const s of validScores) {
      const totalDelta = s.max_score - s.score;
      if (totalDelta > bestOppDelta) {
        bestOppDelta = totalDelta;
        bestOppInst = instMap.get(s.institution_id);

        // Find top gap category within this institution
        let maxCatDelta = 0;
        for (const [key, item] of Object.entries(s.breakdown)) {
          const catDelta = item.max - item.score;
          if (catDelta > maxCatDelta) {
            maxCatDelta = catDelta;
            bestOppCategory = item.description || key;
          }
        }
      }
    }

    const oppName = bestOppInst?.short_name || bestOppInst?.name || "—";

    if (!bestOppCategory) {
      return `Você está mais competitivo em ${topName}. Maior oportunidade: +${bestOppDelta} em ${oppName}.`;
    }

    return `Você está mais competitivo em ${topName}. Maior oportunidade: +${bestOppDelta} em ${oppName}, ${bestOppCategory}.`;
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
