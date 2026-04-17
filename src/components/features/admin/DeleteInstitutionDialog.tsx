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
  useDeleteInstitution,
  type InstitutionRow,
} from "@/lib/queries/admin";

interface DeleteInstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionRow | null;
}

export function DeleteInstitutionDialog({
  open,
  onOpenChange,
  institution,
}: DeleteInstitutionDialogProps) {
  const deleteMutation = useDeleteInstitution();

  const handleDelete = async () => {
    if (!institution || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync({
        id: institution.id,
        pdf_path: institution.pdf_path,
      });
      toast.success("Instituição removida.");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao remover instituição. Tente novamente.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover instituição</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover{" "}
            <strong>{institution?.name}</strong>?
            <br />
            <br />
            Todas as regras vinculadas a esta instituição serão removidas
            permanentemente. Esta ação não pode ser desfeita.
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
