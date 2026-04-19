import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import {
  useInstitutionScore,
  useEditalUrl,
  scoringKeys,
} from "@/lib/queries/scoring";
import { useCurriculum } from "@/lib/queries/curriculum";
import { ScoreHero } from "@/components/features/scoring/ScoreHero";
import { GapAnalysisList } from "@/components/features/scoring/GapAnalysisList";
import { DisclaimerBanner } from "@/components/features/scoring/DisclaimerBanner";
import { useQueryClient } from "@tanstack/react-query";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[96px] w-48" />
      <Skeleton className="h-3 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

const InstitutionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id ?? null;
  const rawSpecialty = profile?.specialty_interest;
  const specialtyId =
    rawSpecialty && UUID_RE.test(rawSpecialty) ? rawSpecialty : undefined;

  const { score, institution, isLoading, isError } = useInstitutionScore(
    userId,
    id,
    specialtyId,
  );

  const editalUrl = useEditalUrl(institution);
  const { data: curriculumRow } = useCurriculum(userId);
  const curriculumData = (curriculumRow?.data ?? {}) as Record<string, unknown>;

  const displayName =
    institution?.short_name || institution?.name || "Instituição";

  const handleRetry = () => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: scoringKeys.scores(userId, specialtyId),
      });
    }
    queryClient.invalidateQueries({
      queryKey: scoringKeys.institutions,
    });
  };

  // 404: dados carregaram mas instituição não encontrada
  if (!isLoading && !isError && !institution) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">Instituição não encontrada</p>
          <Link
            to="/app"
            className="text-sm text-accent hover:underline"
          >
            ← Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">
            Não conseguimos carregar os detalhes desta instituição.
          </p>
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !isError && <DetailSkeleton />}

      {/* Data state */}
      {!isLoading && !isError && institution && (
        <>
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {institution.state && (
                <span className="text-sm text-muted-foreground">
                  {institution.state}
                </span>
              )}
            </div>
            {editalUrl && (
              <a
                href={editalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1 text-sm text-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Ver edital original
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            )}
          </div>

          {/* ScoreHero */}
          {score && (
            <ScoreHero
              score={score.score}
              maxScore={score.max_score}
              institutionName={displayName}
            />
          )}

          {/* GapAnalysisList */}
          {score && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Detalhamento por categoria</h2>
              <GapAnalysisList breakdown={score.breakdown} curriculumData={curriculumData} />
            </div>
          )}

          {/* DisclaimerBanner */}
          <DisclaimerBanner variant="full" />
        </>
      )}
    </div>
  );
};

export default InstitutionDetail;
