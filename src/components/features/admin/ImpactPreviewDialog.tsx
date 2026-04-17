import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  previewRuleImpact,
  useCreateScoringRule,
  useUpdateScoringRule,
  type ImpactPreviewResult,
} from "@/lib/queries/admin";
import type { ScoringRuleFormValues } from "@/lib/schemas/admin";

interface ImpactPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: ScoringRuleFormValues | null;
  ruleId?: string;
  currentWeight?: number;
  onSuccess: () => void;
}

export function ImpactPreviewDialog({
  open,
  onOpenChange,
  values,
  ruleId,
  currentWeight,
  onSuccess,
}: ImpactPreviewDialogProps) {
  const isEditing = !!ruleId;
  const createMutation = useCreateScoringRule();
  const updateMutation = useUpdateScoringRule();
  const mutation = isEditing ? updateMutation : createMutation;

  const [preview, setPreview] = useState<ImpactPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Load preview when dialog opens
  useEffect(() => {
    if (!open || !values) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewError(null);

    previewRuleImpact({
      institution_id: values.institution_id,
      specialty_id: values.specialty_id,
      weight: values.weight,
      max_points: values.max_points,
      field_key: values.field_key,
      current_weight: currentWeight,
    })
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch(() => {
        if (!cancelled)
          setPreviewError("Erro ao calcular impacto. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, values, currentWeight]);

  const handleConfirm = async () => {
    if (!values || mutation.isPending) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: ruleId, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
      toast.success(
        `Regra publicada — ${preview?.affectedCount ?? 0} alunos terao recalculo na proxima sessao`,
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao publicar regra. Tente novamente.");
    }
  };

  const isPending = mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && isPending) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preview de impacto</DialogTitle>
          <DialogDescription>
            Confira o impacto estimado antes de confirmar a publicacao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loadingPreview && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Calculando impacto...
              </p>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {previewError && (
            <p className="text-sm text-destructive" role="alert">
              {previewError}
            </p>
          )}

          {!loadingPreview && !previewError && preview && (
            <>
              <p className="text-sm">
                <strong>{preview.affectedCount}</strong>{" "}
                {preview.affectedCount === 1
                  ? "aluno sera afetado"
                  : "alunos serao afetados"}{" "}
                por esta alteracao.
              </p>

              {preview.samples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Amostra (ate 5 alunos):
                  </p>
                  <ul className="space-y-1 text-sm">
                    {preview.samples.map((s, i) => (
                      <li
                        key={i}
                        className="flex justify-between rounded px-2 py-1 bg-muted"
                      >
                        <span>{s.name}</span>
                        <span className="font-mono">
                          {s.currentScore} &rarr; {s.estimatedScore}{" "}
                          <span
                            className={
                              s.delta >= 0
                                ? "text-emerald-600"
                                : "text-destructive"
                            }
                          >
                            ({s.delta >= 0 ? "+" : ""}
                            {s.delta})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.samples.length === 0 &&
                preview.affectedCount === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum aluno com pontuacao calculada para esta
                    instituicao/especialidade.
                  </p>
                )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || loadingPreview}
          >
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar publicacao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
