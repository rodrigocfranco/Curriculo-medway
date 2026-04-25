import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScores, useInstitutions } from "@/lib/queries/scoring";
import { formatGrade, toGrade } from "@/lib/schemas/scoring";
import type { Institution, UserScore } from "@/lib/schemas/scoring";

interface InstitutionScoresSidebarProps {
  userId: string | null;
  specialtyId?: string;
}

interface AnchorEntry {
  grade: number;
  position: number;
}

interface DeltaEntry {
  gradeDelta: number;
  positionDelta: number;
}

const DELTA_VISIBLE_MS = 10000;

function buildAnchor(scores: UserScore[]): Map<string, AnchorEntry> {
  const map = new Map<string, AnchorEntry>();
  scores.forEach((s, idx) => {
    map.set(s.institution_id, {
      grade: toGrade(s.score, s.max_score),
      position: idx + 1,
    });
  });
  return map;
}

function formatGradeDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return "0,0";
  const sign = rounded > 0 ? "+" : "−";
  const abs = Math.abs(rounded).toFixed(1).replace(".", ",");
  return `${sign}${abs}`;
}

function gradeDeltaClass(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return "text-emerald-600";
  if (rounded < 0) return "text-rose-600";
  return "text-muted-foreground";
}

function positionDeltaClass(delta: number): string {
  if (delta > 0) return "text-emerald-600";
  if (delta < 0) return "text-rose-600";
  return "text-muted-foreground";
}

export function InstitutionScoresSidebar({
  userId,
  specialtyId,
}: InstitutionScoresSidebarProps) {
  const navigate = useNavigate();

  const { data: scores, isLoading: scoresLoading } = useScores(
    userId,
    specialtyId,
  );

  const { data: institutions, isLoading: institutionsLoading } =
    useInstitutions();

  const isLoading = scoresLoading || institutionsLoading;

  const instMap = useMemo(
    () =>
      new Map<string, Institution>(
        institutions?.map((i) => [i.id, i]) ?? [],
      ),
    [institutions],
  );

  const sortedScores = useMemo(() => {
    if (!scores) return [];
    return [...scores].sort((a, b) => {
      const ga = a.max_score > 0 ? a.score / a.max_score : 0;
      const gb = b.max_score > 0 ? b.score / b.max_score : 0;
      return gb - ga;
    });
  }, [scores]);

  // Âncora de comparação (snapshot estável). Só atualiza após 3s sem mudanças.
  const anchorRef = useRef<Map<string, AnchorEntry> | null>(null);
  const sortedScoresRef = useRef(sortedScores);
  sortedScoresRef.current = sortedScores;

  const [deltas, setDeltas] = useState<Map<string, DeltaEntry>>(new Map());
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAnchor = useCallback(() => {
    anchorRef.current = buildAnchor(sortedScoresRef.current);
    setDeltas(new Map());
    hideTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (sortedScores.length === 0) return;

    // Primeiro fetch: define a âncora silenciosamente, sem deltas.
    if (!anchorRef.current) {
      anchorRef.current = buildAnchor(sortedScores);
      return;
    }

    const anchor = anchorRef.current;
    const newDeltas = new Map<string, DeltaEntry>();
    let anyChanged = false;

    sortedScores.forEach((score, idx) => {
      const grade = toGrade(score.score, score.max_score);
      const position = idx + 1;
      const prev = anchor.get(score.institution_id);
      if (!prev) return;

      const gradeDelta = grade - prev.grade;
      const positionDelta = prev.position - position;
      const gradeChanged = Math.abs(gradeDelta) >= 0.05;
      const positionChanged = positionDelta !== 0;

      newDeltas.set(score.institution_id, { gradeDelta, positionDelta });
      if (gradeChanged || positionChanged) anyChanged = true;
    });

    // De volta ao anchor: limpa deltas visíveis e cancela o timer pendente
    // para evitar valores congelados após o usuário desfazer mudanças.
    if (!anyChanged) {
      setDeltas((prev) => (prev.size === 0 ? prev : new Map()));
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }

    setDeltas(newDeltas);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(resetAnchor, DELTA_VISIBLE_MS);
  }, [sortedScores, resetAnchor]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const totalCount = sortedScores.length;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Sua nota nas instituições</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ))}
        </div>
      ) : sortedScores.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma instituição cadastrada.
        </p>
      ) : (
        <Card className="divide-y overflow-hidden">
          {sortedScores.map((score, idx) => {
            const inst = instMap.get(score.institution_id);
            if (!inst) return null;

            const displayName = inst.short_name || inst.name;
            const grade = formatGrade(score.score, score.max_score);
            const position = idx + 1;
            const delta = deltas.get(score.institution_id);
            const gradeDelta = delta?.gradeDelta ?? 0;
            const positionDelta = delta?.positionDelta ?? 0;
            const showDeltas = deltas.size > 0;

            return (
              <button
                type="button"
                key={score.institution_id}
                onClick={() => navigate(`/app/instituicoes/${inst.id}`)}
                aria-label={`${displayName}, ${position}º de ${totalCount}, nota ${grade}, ver detalhes`}
                className="group flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-7 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {position}º
                </span>

                {showDeltas && (
                  <span
                    className={`flex w-9 shrink-0 items-center gap-0.5 text-[11px] font-semibold tabular-nums ${positionDeltaClass(positionDelta)}`}
                    aria-hidden="true"
                  >
                    {positionDelta > 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : positionDelta < 0 ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <span className="w-3 text-center">—</span>
                    )}
                    {positionDelta !== 0 && Math.abs(positionDelta)}
                  </span>
                )}

                <span className="flex-1 truncate text-sm font-medium">
                  {displayName}
                </span>

                <span className="text-base font-bold tabular-nums">
                  {grade}
                </span>

                {showDeltas && (
                  <span
                    className={`w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums ${gradeDeltaClass(gradeDelta)}`}
                    aria-hidden="true"
                  >
                    {formatGradeDelta(gradeDelta)}
                  </span>
                )}

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
