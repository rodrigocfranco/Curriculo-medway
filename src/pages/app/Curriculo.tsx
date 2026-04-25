import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/useAuth";
import {
  useCurriculumFields,
  useCurriculum,
  useUpdateCurriculum,
} from "@/lib/queries/curriculum";
import { scoringKeys } from "@/lib/queries/scoring";
import {
  curriculumDataSchema,
  type CurriculumData,
} from "@/lib/schemas/curriculum";
import { useAutosave, getLocalDraft } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/features/curriculum/AutosaveIndicator";
import { CurriculoFormSection } from "@/components/features/curriculum/CurriculoFormSection";
import { InstitutionScoresSidebar } from "@/components/features/curriculum/InstitutionScoresSidebar";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Category display order
const CATEGORY_ORDER = [
  "Formação",
  "Pesquisa e Publicações",
  "Atividades Acadêmicas",
  "Congressos e Formação Complementar",
  "Representação Estudantil e Voluntariado",
  "Qualificações",
];

function categoryToValue(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function CurriculoSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}

// P12: Error state component
function CurriculoError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-muted-foreground">
        Não conseguimos carregar o formulário. Verifique sua conexão e tente
        novamente.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Recarregar
      </Button>
    </div>
  );
}

const Curriculo = () => {
  const navigate = useNavigate();
  // P8: read searchParams for accordion deep-link
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("seção") ?? searchParams.get("secao");

  const { user, profile } = useAuth();
  const userId = user?.id ?? "";
  const storageKey = `curriculum-draft-${userId}`;
  const queryClient = useQueryClient();
  const rawSpecialty = profile?.specialty_interest;
  const specialtyId =
    rawSpecialty && UUID_RE.test(rawSpecialty) ? rawSpecialty : undefined;

  const {
    data: fieldsByCategory,
    isLoading: fieldsLoading,
    isError: fieldsError,
    refetch: refetchFields,
  } = useCurriculumFields();
  const {
    data: userCurriculum,
    isLoading: curriculumLoading,
    isError: curriculumError,
    refetch: refetchCurriculum,
  } = useCurriculum(userId || null);
  // P4: only create mutation when userId is available
  const updateCurriculum = useUpdateCurriculum(userId);

  // Estado conhecido do servidor (parsed pelo schema) — usado pelo autosave
  // para evitar salvar a hidratação inicial.
  const serverState = useMemo(() => {
    const serverData =
      (userCurriculum?.data as Partial<CurriculumData>) ?? {};
    return curriculumDataSchema.parse(serverData);
  }, [userCurriculum]);

  // Resolve default values: server data vs localStorage draft
  const defaultValues = useMemo(() => {
    const serverData =
      (userCurriculum?.data as Partial<CurriculumData>) ?? {};
    const localDraft = getLocalDraft<Partial<CurriculumData>>(storageKey);

    let resolved = serverData;
    if (localDraft) {
      const serverUpdated = userCurriculum?.updated_at
        ? new Date(userCurriculum.updated_at)
        : new Date(0);
      const draftUpdated = new Date(localDraft.timestamp);
      if (draftUpdated > serverUpdated) {
        resolved = { ...serverData, ...localDraft.data };
      }
    }

    return curriculumDataSchema.parse(resolved);
  }, [userCurriculum, storageKey]);

  const form = useForm<CurriculumData>({
    resolver: zodResolver(curriculumDataSchema),
    defaultValues,
    // P2: removed `values` prop to prevent form reset on server refetch
    // P10: validate on blur for inline error feedback
    mode: "onBlur",
  });

  // Reset form when server data loads (e.g. after navigating back)
  const hasResetRef = useRef(false);
  useEffect(() => {
    if (userCurriculum && !hasResetRef.current) {
      hasResetRef.current = true;
      form.reset(defaultValues);
    }
  }, [userCurriculum, defaultValues, form]);

  const watchedData = form.watch();

  // P11: Sonner toast callback for autosave errors
  const handleAutosaveError = (error: unknown) => {
    const message =
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("JWT"))
        ? "Sua sessão expirou. Faça login novamente."
        : "Não foi possível salvar. Suas alterações estão seguras localmente.";
    toast.error(message);
  };

  const { status, lastSavedAt, retryCount, retry, flush } = useAutosave({
    // P4: only enable autosave when userId is available
    data: userId ? watchedData : ({} as CurriculumData),
    serverState: userId && userCurriculum ? serverState : undefined,
    saveFn: async (data) => {
      if (!userId) return;
      await updateCurriculum.mutateAsync(data);
      // Trigger DB marca user_scores.stale=true no upsert; invalida pra que
      // useScores refaça e dispare calculate_scores RPC.
      queryClient.invalidateQueries({
        queryKey: scoringKeys.scores(userId, specialtyId),
      });
    },
    debounceMs: 300,
    storageKey: userId ? storageKey : undefined,
    onError: handleAutosaveError,
  });

  const handleSectionBlur = () => {
    flush();
  };

  // P3: await flush before navigating
  const handleNavigateResults = async () => {
    await flush();
    navigate("/app");
  };

  const isLoading = fieldsLoading || curriculumLoading;
  // P12: detect error state
  const isError = fieldsError || curriculumError;

  // Sort categories in display order
  const sortedCategories = useMemo(() => {
    if (!fieldsByCategory) return [];
    return CATEGORY_ORDER.filter((cat) => fieldsByCategory[cat]);
  }, [fieldsByCategory]);

  // P5 + P8: nenhuma seção aberta por padrão, exceto se vier via query param
  const defaultAccordionValue = sectionParam || undefined;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Currículo</h1>
          <p className="text-sm text-muted-foreground">
            Preencha no seu tempo. Tudo é salvo automaticamente.
          </p>
        </div>
        <AutosaveIndicator
          status={status}
          lastSavedAt={lastSavedAt}
          retryCount={retryCount}
          onRetry={retry}
        />
      </div>

      {/* P12: Error state */}
      {isError ? (
        <CurriculoError
          onRetry={() => {
            refetchFields();
            refetchCurriculum();
          }}
        />
      ) : (
        <>
          {/* Layout: formulário à esquerda, resumo à direita (desktop) */}
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Formulário */}
            <div className="w-full lg:w-3/5">
              {isLoading ? (
                <CurriculoSkeleton />
              ) : (
                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue={defaultAccordionValue}
                      className="space-y-2"
                      onValueChange={() => handleSectionBlur()}
                    >
                      {sortedCategories.map((category) => (
                        <CurriculoFormSection
                          key={category}
                          category={category}
                          fields={fieldsByCategory![category]}
                          form={form}
                          onBlur={handleSectionBlur}
                        />
                      ))}
                    </Accordion>
                  </form>
                </Form>
              )}
            </div>

            {/* Notas por instituição em tempo real (sidebar desktop / abaixo no mobile) */}
            <div className="w-full lg:w-2/5">
              <div className="lg:sticky lg:top-20">
                <InstitutionScoresSidebar
                  userId={userId || null}
                  specialtyId={specialtyId}
                />
              </div>
            </div>
          </div>

          {/* CTA fixo no bottom */}
          <div className="sticky bottom-0 z-10 mt-8 border-t bg-background px-4 py-4 pb-safe sm:px-0">
            <div className="mx-auto max-w-md">
              <Button
                size="lg"
                className="w-full"
                onClick={handleNavigateResults}
              >
                Ver detalhamento por instituição
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Curriculo;
