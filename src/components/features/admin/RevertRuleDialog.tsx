import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useRevertRule,
  type ScoringRulesAuditRow,
} from "@/lib/queries/admin";

interface RevertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: ScoringRulesAuditRow | null;
}

function summarizeOldValues(
  entry: ScoringRulesAuditRow | null,
): string {
  if (!entry?.old_values) return "";
  const { category, field_key, weight, max_points } = entry.old_values as Record<
    string,
    unknown
  >;
  const parts: string[] = [];
  if (category) parts.push(`Categoria: ${category}`);
  if (field_key) parts.push(`Campo: ${field_key}`);
  if (weight !== undefined) parts.push(`Peso: ${weight}`);
  if (max_points !== undefined) parts.push(`Teto: ${max_points}`);
  return parts.join(" | ");
}

export function RevertRuleDialog({
  open,
  onOpenChange,
  entry,
}: RevertRuleDialogProps) {
  const revertMutation = useRevertRule();

  const handleRevert = async () => {
    if (!entry || revertMutation.isPending) return;

    try {
      await revertMutation.mutateAsync({ auditEntry: entry });
      toast.success(
        "Regra revertida com sucesso — alunos afetados terao recalculo na proxima sessao.",
      );
      onOpenChange(false);
    } catch {
      toast.error("Erro ao reverter regra. Tente novamente.");
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v && revertMutation.isPending) return;
        onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverter alteracao</AlertDialogTitle>
          <AlertDialogDescription>
            Reverter esta alteracao restaurara a regra para o estado anterior.
            Uma nova entrada de historico sera criada automaticamente.
            {entry && (
              <>
                <br />
                <br />
                <strong>Estado a restaurar:</strong>
                <br />
                {summarizeOldValues(entry)}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revertMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevert}
            disabled={revertMutation.isPending}
          >
            {revertMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar reversao
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
