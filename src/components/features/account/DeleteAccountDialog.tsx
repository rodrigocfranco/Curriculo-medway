import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/useAuth";
import { useDeleteAccount } from "@/lib/queries/account";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const deleteMutation = useDeleteAccount();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isValid = confirmation === "EXCLUIR";

  const handleDelete = async () => {
    if (!isValid || deleteMutation.isPending) return;

    try {
      await deleteMutation.mutateAsync();
      toast.success("Conta excluída com sucesso");
      onOpenChange(false);
      await signOut();
      navigate("/", { replace: true });
    } catch {
      toast.error("Não foi possível excluir sua conta. Tente novamente.");
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setConfirmation("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir minha conta</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. Todos os seus dados pessoais, currículo e
            scores serão permanentemente removidos. Dados estatísticos
            anonimizados serão preservados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="delete-confirmation">
            Digite <strong>EXCLUIR</strong> para confirmar
          </Label>
          <Input
            id="delete-confirmation"
            data-testid="delete-confirmation-input"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isValid || deleteMutation.isPending}
            data-testid="confirm-delete-account"
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Excluir conta permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
