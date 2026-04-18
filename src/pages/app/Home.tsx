import { useMemo, useState } from "react";
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
import { toGrade } from "@/lib/schemas/scoring";
import { ScoreCard } from "@/components/features/scoring/ScoreCard";
import { NarrativeBanner } from "@/components/features/scoring/NarrativeBanner";
import { DisclaimerBanner } from "@/components/features/scoring/DisclaimerBanner";
import { SpecialtySelector } from "@/components/features/scoring/SpecialtySelector";
import type { Institution, UserScore } from "@/lib/schemas/scoring";

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

  const [stateFilter, setStateFilter] = useState<string>("Brasil");

  const instMap = useMemo(
    () => new Map<string, Institution>(institutions?.map((i) => [i.id, i]) ?? []),
    [institutions],
  );

  // Estados únicos das instituições
  const availableStates = useMemo(() => {
    if (!institutions) return [];
    const states = new Set(institutions.map((i) => i.state).filter(Boolean) as string[]);
    return Array.from(states).sort();
  }, [institutions]);

  // Scores filtrados por estado e ordenados por nota (maior primeiro)
  const filteredScores = useMemo(() => {
    if (!scores) return [];
    let filtered = scores;
    if (stateFilter !== "Brasil") {
      filtered = scores.filter((s) => {
        const inst = instMap.get(s.institution_id);
        return inst?.state === stateFilter;
      });
    }
    return [...filtered].sort((a, b) => {
      const gradeA = a.max_score > 0 ? a.score / a.max_score : 0;
      const gradeB = b.max_score > 0 ? b.score / b.max_score : 0;
      return gradeB - gradeA;
    });
  }, [scores, stateFilter, instMap]);

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

  const filteredCount = filteredScores.length;
  const totalCount = scores?.length ?? institutions?.length ?? 0;

  return (
    <div className="dashboard-enter space-y-6">
      {/* Subheader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">
          Sua posição em {isLoading ? "…" : stateFilter === "Brasil" ? totalCount : filteredCount} instituições
          {stateFilter !== "Brasil" && !isLoading && (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              ({stateFilter})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          <SpecialtySelector />
          <DisclaimerBanner variant="compact" />
        </div>
      </div>

      {/* Filtro por estado */}
      {!isLoading && !isError && availableStates.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={stateFilter === "Brasil" ? "default" : "outline"}
            size="sm"
            onClick={() => setStateFilter("Brasil")}
          >
            Brasil
          </Button>
          {availableStates.map((state) => (
            <Button
              key={state}
              variant={stateFilter === state ? "default" : "outline"}
              size="sm"
              onClick={() => setStateFilter(state)}
            >
              {state}
            </Button>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && <DashboardError onRetry={handleRetry} />}

      {/* Loading state */}
      {isLoading && !isError && (
        <>
          <Skeleton className="h-12 w-full rounded-lg" />
          <DashboardSkeleton count={totalCount || 11} />
        </>
      )}

      {/* Data state */}
      {!isLoading && !isError && scores && institutions && (
        <>
          <NarrativeBanner scores={scores} institutions={institutions} />
          {filteredScores.length === 0 && stateFilter !== "Brasil" ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma instituição em {stateFilter}.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredScores.map((score) => {
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
          )}
        </>
      )}
    </div>
  );
};

export default AppHome;
