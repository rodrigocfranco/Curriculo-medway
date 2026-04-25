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
  useEditalUrl,
  scoringKeys,
} from "@/lib/queries/scoring";
import { useCurriculum } from "@/lib/queries/curriculum";
import { ScoreCard } from "@/components/features/scoring/ScoreCard";
import { NarrativeBanner } from "@/components/features/scoring/NarrativeBanner";
import { DisclaimerBanner } from "@/components/features/scoring/DisclaimerBanner";
import { SpecialtySelector } from "@/components/features/scoring/SpecialtySelector";
import { Podium, type PodiumEntry } from "@/components/features/scoring/Podium";
import { InstitutionDetailView } from "@/components/features/scoring/InstitutionDetailView";
import type { Institution } from "@/lib/schemas/scoring";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function DashboardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[56px] rounded-lg" />
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

  const availableStates = useMemo(() => {
    if (!institutions) return [];
    const states = new Set(institutions.map((i) => i.state).filter(Boolean) as string[]);
    return Array.from(states).sort();
  }, [institutions]);

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

  const podiumEntries: PodiumEntry[] = useMemo(() => {
    return filteredScores
      .slice(0, 3)
      .map((score) => {
        const inst = instMap.get(score.institution_id);
        return inst ? { institution: inst, score } : null;
      })
      .filter((entry): entry is PodiumEntry => entry !== null);
  }, [filteredScores, instMap]);

  const otherScores = useMemo(() => filteredScores.slice(3), [filteredScores]);

  const top1Entry = podiumEntries[0] ?? null;
  const topEditalUrl = useEditalUrl(top1Entry?.institution ?? null);
  const { data: curriculumRow } = useCurriculum(userId);
  const curriculumData = (curriculumRow?.data ?? {}) as Record<string, unknown>;

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
  const noResultsForState =
    !isLoading && !isError && filteredScores.length === 0 && stateFilter !== "Brasil";

  return (
    <div className="dashboard-enter space-y-8">
      {/* Subheader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">
          Sua nota em {isLoading ? "…" : stateFilter === "Brasil" ? totalCount : filteredCount} instituições
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

          {noResultsForState ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma instituição em {stateFilter}.
            </div>
          ) : (
            <>
              {/* Divisão 1: Pódio top 3 */}
              <section aria-labelledby="podium-heading" className="space-y-4">
                <h2 id="podium-heading" className="sr-only">
                  Top 3 instituições
                </h2>
                <Podium
                  entries={podiumEntries}
                  onCardClick={(id) => navigate(`/app/instituicoes/${id}`)}
                  onEmptyClick={() => navigate("/app/curriculo")}
                />
              </section>

              {/* Divisão 2: Outras instituições (4º+) */}
              {otherScores.length > 0 && (
                <section aria-labelledby="others-heading" className="space-y-4">
                  <h2 id="others-heading" className="text-lg font-semibold">
                    Outras instituições
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {otherScores.map((score) => {
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
                </section>
              )}

              {/* Divisão 3: Detalhe top 1 */}
              {top1Entry && (
                <section aria-labelledby="top1-heading" className="space-y-4">
                  <div>
                    <h2 id="top1-heading" className="text-lg font-semibold">
                      Veja no detalhe sua nota na top 1
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Para ver no detalhe outras instituições, basta clicar no
                      card delas.
                    </p>
                  </div>
                  <InstitutionDetailView
                    institution={top1Entry.institution}
                    score={top1Entry.score}
                    editalUrl={topEditalUrl}
                    curriculumData={curriculumData}
                    showDisclaimer={false}
                  />
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AppHome;
