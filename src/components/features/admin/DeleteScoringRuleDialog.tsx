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
  useDeleteScoringRule,
  type ScoringRuleRow,
} from "@/lib/queries/admin";

interface DeleteScoringRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: ScoringRuleRow | null;
}

export function DeleteScoringRuleDialog({
  open,
  onOpenChange,
  rule,
}: DeleteScoringRuleDialogProps) {
  const deleteMutation = useDeleteScoringRule();

  const handleDelete = async () => {
    if (!rule || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync({ id: rule.id });
      toast.success("Regra removida.");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao remover regra. Tente novamente.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v && deleteMutation.isPending) return; onOpenChange(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover regra</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover a regra{" "}
            <strong>{rule?.field_key}</strong> (categoria: {rule?.category})?
            <br />
            <br />
            Os alunos afetados terao seus scores recalculados na proxima sessao.
            Esta acao nao pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
