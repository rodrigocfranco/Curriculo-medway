import type { ScoringRulesAuditRow } from "@/lib/queries/admin";

const FIELD_LABELS: Record<string, string> = {
  institution_id: "Instituicao",
  specialty_id: "Especialidade",
  category: "Categoria",
  field_key: "Campo",
  weight: "Peso",
  max_points: "Pontuacao maxima",
  description: "Descricao",
  formula: "Formula",
};

const IGNORED_FIELDS = new Set(["id", "created_at", "updated_at"]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

interface AuditDiffViewProps {
  entry: ScoringRulesAuditRow;
  institutionMap: Map<string, string>;
}

export function AuditDiffView({ entry, institutionMap }: AuditDiffViewProps) {
  const { change_type, old_values, new_values } = entry;

  const resolveDisplay = (key: string, value: unknown): string => {
    if (key === "institution_id" && typeof value === "string") {
      return institutionMap.get(value) ?? String(value);
    }
    return formatValue(value);
  };

  if (change_type === "INSERT" && new_values) {
    const fields = Object.entries(new_values).filter(
      ([k]) => !IGNORED_FIELDS.has(k),
    );
    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium text-muted-foreground mb-2">Campos criados:</p>
        {fields.map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium min-w-[140px]">
              {FIELD_LABELS[key] ?? key}:
            </span>
            <span className="text-green-700 dark:text-green-400">
              {resolveDisplay(key, val)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (change_type === "DELETE" && old_values) {
    const fields = Object.entries(old_values).filter(
      ([k]) => !IGNORED_FIELDS.has(k),
    );
    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium text-muted-foreground mb-2">
          Campos removidos:
        </p>
        {fields.map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium min-w-[140px]">
              {FIELD_LABELS[key] ?? key}:
            </span>
            <span className="text-red-700 dark:text-red-400">
              {resolveDisplay(key, val)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (change_type === "UPDATE" && old_values && new_values) {
    const changedFields = Object.keys(new_values).filter((key) => {
      if (IGNORED_FIELDS.has(key)) return false;
      return (
        JSON.stringify(old_values[key]) !== JSON.stringify(new_values[key])
      );
    });

    if (changedFields.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Nenhum campo alterado detectado.
        </p>
      );
    }

    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium text-muted-foreground mb-2">
          Campos alterados:
        </p>
        {changedFields.map((key) => (
          <div key={key} className="flex gap-2 flex-wrap">
            <span className="font-medium min-w-[140px]">
              {FIELD_LABELS[key] ?? key}:
            </span>
            <span className="text-red-700 dark:text-red-400 line-through">
              {resolveDisplay(key, old_values[key])}
            </span>
            <span className="text-muted-foreground">&rarr;</span>
            <span className="text-green-700 dark:text-green-400">
              {resolveDisplay(key, new_values[key])}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Detalhes indisponiveis para esta entrada.
    </p>
  );
}
