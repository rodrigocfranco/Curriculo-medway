import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/useAuth";
import { useSpecialties } from "@/lib/queries/scoring";
import { DeleteAccountDialog } from "@/components/features/account/DeleteAccountDialog";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="text-sm font-medium text-muted-foreground sm:w-48 sm:shrink-0">
        {label}
      </span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

export default function Conta() {
  const { user, profile } = useAuth();
  const { data: specialties } = useSpecialties();
  const [dialogOpen, setDialogOpen] = useState(false);

  const specialtyName =
    specialties?.find((s) => s.id === profile?.specialty_interest)?.name
    ?? profile?.specialty_interest
    ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações de cadastro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Nome" value={profile?.name} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Telefone" value={profile?.phone} />
          <InfoRow label="Estado" value={profile?.state} />
          <InfoRow label="Faculdade" value={profile?.university} />
          <InfoRow
            label="Ano de formação"
            value={profile?.graduation_year?.toString()}
          />
          <InfoRow
            label="Especialidade de interesse"
            value={specialtyName}
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">
            Excluir conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <p className="text-sm text-muted-foreground">
            Ao excluir sua conta, todos os seus dados pessoais, currículo e
            scores serão permanentemente removidos. Esta ação não pode ser
            desfeita.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDialogOpen(true)}
            data-testid="open-delete-dialog"
          >
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
