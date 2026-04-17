import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/useAuth";
import {
  useScores,
  useInstitutions,
  scoringKeys,
} from "@/lib/queries/scoring";
import { ScoreCard } from "@/components/features/scoring/ScoreCard";
import { NarrativeBanner } from "@/components/features/scoring/NarrativeBanner";
import { DisclaimerBanner } from "@/components/features/scoring/DisclaimerBanner";
import { SpecialtySelector } from "@/components/features/scoring/SpecialtySelector";
import type { Institution } from "@/lib/schemas/scoring";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function DashboardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[180px] rounded-lg" />
      ))}
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-muted-foreground">
        Não conseguimos carregar seus scores. Verifique sua conexão e tente
        novamente.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

const AppHome = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;
  const rawSpecialty = profile?.specialty_interest;
  const specialtyId =
    rawSpecialty && UUID_RE.test(rawSpecialty) ? rawSpecialty : undefined;

  const {
    data: scores,
    isLoading: scoresLoading,
    isError: scoresError,
  } = useScores(userId, specialtyId);

  const {
    data: institutions,
    isLoading: institutionsLoading,
    isError: institutionsError,
  } = useInstitutions();

  const isLoading = scoresLoading || institutionsLoading;
  const isError = scoresError || institutionsError;

  const instMap = useMemo(
    () => new Map<string, Institution>(institutions?.map((i) => [i.id, i]) ?? []),
    [institutions],
  );

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

  // Use scores count for heading — matches actual rendered cards
  const institutionCount = scores?.length ?? institutions?.length ?? 0;

  return (
    <div className="dashboard-enter space-y-6">
      {/* Subheader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">
          Sua posição em {isLoading ? "…" : institutionCount} instituições
        </h1>
        <div className="flex items-center gap-3">
          <SpecialtySelector />
          <DisclaimerBanner variant="compact" />
        </div>
      </div>

      {/* Error state */}
      {isError && <DashboardError onRetry={handleRetry} />}

      {/* Loading state */}
      {isLoading && !isError && (
        <>
          <Skeleton className="h-12 w-full rounded-lg" />
          <DashboardSkeleton count={institutionCount || 11} />
        </>
      )}

      {/* Data state */}
      {!isLoading && !isError && scores && institutions && (
        <>
          <NarrativeBanner scores={scores} institutions={institutions} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {scores.map((score) => {
              const inst = instMap.get(score.institution_id);
              if (!inst) return null;
              return (
                <ScoreCard
                  key={score.institution_id}
                  institution={inst}
                  score={score}
                  onClick={() => navigate(`/app/instituicoes/${inst.id}`)}
                  onEmptyClick={() => navigate("/app/curriculo")}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AppHome;
