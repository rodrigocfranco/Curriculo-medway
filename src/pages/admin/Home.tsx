import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstitutions, useInstitutionRuleCounts, type InstitutionRow } from "@/lib/queries/admin";
import { InstitutionTable } from "@/components/features/admin/InstitutionTable";
import { InstitutionFormDialog } from "@/components/features/admin/InstitutionFormDialog";
import { DeleteInstitutionDialog } from "@/components/features/admin/DeleteInstitutionDialog";

const AdminHome = () => {
  const { data: institutions, isLoading, error } = useInstitutions();
  const { data: ruleCounts } = useInstitutionRuleCounts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<InstitutionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstitutionRow | null>(null);

  const handleEdit = (institution: InstitutionRow) => {
    setEditingInstitution(institution);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingInstitution(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Instituições</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as instituições e seus editais.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova instituição
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar instituições. Verifique sua conexão e tente novamente.
        </div>
      )}

      <InstitutionTable
        institutions={institutions}
        ruleCounts={ruleCounts}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <InstitutionFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        institution={editingInstitution}
      />

      <DeleteInstitutionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        institution={deleteTarget}
      />
    </section>
  );
};

export default AdminHome;
