import { useMemo, useState } from "react";
import {
  useAuditLog,
  useInstitutions,
  useAdminProfiles,
  type ScoringRulesAuditRow,
} from "@/lib/queries/admin";
import { AuditLogTable } from "@/components/features/admin/AuditLogTable";
import { RevertRuleDialog } from "@/components/features/admin/RevertRuleDialog";

const Historico = () => {
  const { data: auditData, isLoading, error } = useAuditLog();
  const { data: institutions } = useInstitutions();
  const { data: adminProfiles } = useAdminProfiles();

  const [revertTarget, setRevertTarget] = useState<ScoringRulesAuditRow | null>(
    null,
  );

  const adminMap = useMemo(
    () => new Map(adminProfiles?.map((p) => [p.id, p.name ?? "Admin"]) ?? []),
    [adminProfiles],
  );

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Historico de alteracoes</h1>
        <p className="text-sm text-muted-foreground">
          Auditoria completa das alteracoes em regras de pontuacao.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar historico. Verifique sua conexao e tente novamente.
        </div>
      )}

      <AuditLogTable
        data={auditData}
        institutions={institutions}
        adminMap={adminMap}
        isLoading={isLoading}
        onRevert={setRevertTarget}
      />

      <RevertRuleDialog
        open={!!revertTarget}
        onOpenChange={(open) => {
          if (!open) setRevertTarget(null);
        }}
        entry={revertTarget}
      />
    </section>
  );
};

export default Historico;
