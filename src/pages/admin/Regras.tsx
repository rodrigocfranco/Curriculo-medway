import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useInstitutions,
  useScoringRules,
  useSpecialties,
  type ScoringRuleRow,
} from "@/lib/queries/admin";
import { ScoringRuleTable } from "@/components/features/admin/ScoringRuleTable";
import { ScoringRuleFormDialog } from "@/components/features/admin/ScoringRuleFormDialog";
import { ImpactPreviewDialog } from "@/components/features/admin/ImpactPreviewDialog";
import { DeleteScoringRuleDialog } from "@/components/features/admin/DeleteScoringRuleDialog";
import type { ScoringRuleFormValues } from "@/lib/schemas/admin";

const Regras = () => {
  // Filters
  const [filterInstitution, setFilterInstitution] = useState<string | null>(
    null,
  );
  const [filterSpecialty, setFilterSpecialty] = useState<string | null>(null);

  // Data
  const { data: institutions } = useInstitutions();
  const { data: specialties } = useSpecialties();
  const {
    data: rules,
    isLoading,
    error,
  } = useScoringRules(filterInstitution, filterSpecialty);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRuleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScoringRuleRow | null>(null);

  // Impact preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] =
    useState<ScoringRuleFormValues | null>(null);
  const [previewRuleId, setPreviewRuleId] = useState<string | undefined>();
  const [previewCurrentWeight, setPreviewCurrentWeight] = useState<
    number | undefined
  >();

  const handleEdit = (rule: ScoringRuleRow) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingRule(null);
  };

  const handlePublish = (values: ScoringRuleFormValues, ruleId?: string) => {
    setPreviewValues(values);
    setPreviewRuleId(ruleId);
    setPreviewCurrentWeight(editingRule?.weight);
    setFormOpen(false);
    setPreviewOpen(true);
  };

  const handlePreviewSuccess = () => {
    setEditingRule(null);
    setPreviewValues(null);
    setPreviewRuleId(undefined);
    setPreviewCurrentWeight(undefined);
  };

  // Sort: default rules (no specialty) first
  const sortedRules = rules
    ? [...rules].sort((a, b) => {
        if (!a.specialty_id && b.specialty_id) return -1;
        if (a.specialty_id && !b.specialty_id) return 1;
        return 0;
      })
    : undefined;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Regras de pontuacao</h1>
          <p className="text-sm text-muted-foreground">
            Configure as regras de calculo por instituicao e especialidade.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova regra
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={filterInstitution ?? "__all__"}
          onValueChange={(v) =>
            setFilterInstitution(v === "__all__" ? null : v)
          }
        >
          <SelectTrigger className="w-[220px]" aria-label="Filtrar por instituicao">
            <SelectValue placeholder="Todas as instituicoes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as instituicoes</SelectItem>
            {institutions?.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {inst.short_name || inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterSpecialty ?? "__all__"}
          onValueChange={(v) =>
            setFilterSpecialty(v === "__all__" ? null : v)
          }
        >
          <SelectTrigger className="w-[220px]" aria-label="Filtrar por especialidade">
            <SelectValue placeholder="Todas as especialidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as especialidades</SelectItem>
            {specialties?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar regras. Verifique sua conexao e tente novamente.
        </div>
      )}

      <ScoringRuleTable
        rules={sortedRules}
        institutions={institutions}
        specialties={specialties}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <ScoringRuleFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        rule={editingRule}
        onPublish={handlePublish}
      />

      <ImpactPreviewDialog
        open={previewOpen}
        onOpenChange={(v) => {
          setPreviewOpen(v);
          if (!v) {
            setPreviewValues(null);
            setPreviewRuleId(undefined);
            setPreviewCurrentWeight(undefined);
            setEditingRule(null);
          }
        }}
        values={previewValues}
        ruleId={previewRuleId}
        currentWeight={previewCurrentWeight}
        onSuccess={handlePreviewSuccess}
      />

      <DeleteScoringRuleDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        rule={deleteTarget}
      />
    </section>
  );
};

export default Regras;
