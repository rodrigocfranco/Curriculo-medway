import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import {
  useInstitutionScore,
  useEditalUrl,
  scoringKeys,
} from "@/lib/queries/scoring";
import { useCurriculum } from "@/lib/queries/curriculum";
import { InstitutionDetailView } from "@/components/features/scoring/InstitutionDetailView";
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
    <div className="mx-auto max-w-7xl space-y-6">
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
        <InstitutionDetailView
          institution={institution}
          score={score}
          editalUrl={editalUrl}
          curriculumData={curriculumData}
        />
      )}
    </div>
  );
};

export default InstitutionDetail;
