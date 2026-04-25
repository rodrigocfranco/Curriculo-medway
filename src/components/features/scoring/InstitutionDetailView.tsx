import { ExternalLink } from "lucide-react";
import type { Institution, UserScore } from "@/lib/schemas/scoring";
import { formatGrade } from "@/lib/schemas/scoring";
import { GapAnalysisList } from "./GapAnalysisList";
import { DisclaimerBanner } from "./DisclaimerBanner";

interface InstitutionDetailViewProps {
  institution: Institution;
  score: UserScore | null;
  editalUrl: string | null;
  curriculumData: Record<string, unknown>;
  showDisclaimer?: boolean;
}

export function InstitutionDetailView({
  institution,
  score,
  editalUrl,
  curriculumData,
  showDisclaimer = true,
}: InstitutionDetailViewProps) {
  const displayName = institution.short_name || institution.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        {institution.state && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {institution.state}
          </span>
        )}
        {score && (
          <div className="flex items-center gap-3 rounded-full bg-accent/10 py-1.5 pl-4 pr-5">
            <span className="text-2xl font-bold tabular-nums text-accent">
              {formatGrade(score.score, score.max_score)}
            </span>
            <span className="text-sm text-muted-foreground">
              {score.score} / {score.max_score} pts
            </span>
          </div>
        )}
        {editalUrl && (
          <a
            href={editalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Edital
            <span className="sr-only">(abre em nova aba)</span>
          </a>
        )}
      </div>

      {score && (
        <GapAnalysisList breakdown={score.breakdown} curriculumData={curriculumData} />
      )}

      {showDisclaimer && <DisclaimerBanner variant="full" />}
    </div>
  );
}
