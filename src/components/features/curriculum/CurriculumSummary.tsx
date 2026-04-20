import type { CurriculumFieldRow } from "@/lib/queries/curriculum";
import type { CurriculumData } from "@/lib/schemas/curriculum";

interface CurriculumSummaryProps {
  fieldsByCategory: Record<string, CurriculumFieldRow[]>;
  data: CurriculumData;
  categoryOrder: string[];
}

function formatValue(
  value: unknown,
  fieldType: string,
): string {
  if (fieldType === "boolean") {
    return value === true ? "Sim" : "Não";
  }
  if (fieldType === "number") {
    if (typeof value === "number" && value > 0) return String(value);
    return "—";
  }
  if (fieldType === "select" || fieldType === "text") {
    if (typeof value === "string" && value !== "") return value;
    return "—";
  }
  return "—";
}

export function CurriculumSummary({
  fieldsByCategory,
  data,
  categoryOrder,
}: CurriculumSummaryProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Resumo do currículo</h2>
      {categoryOrder
        .filter((cat) => fieldsByCategory[cat])
        .map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="text-base font-semibold">{category}</h3>
            <div className="divide-y rounded-md border">
              {fieldsByCategory[category].map((field) => {
                const value = data[field.field_key as keyof CurriculumData];
                return (
                  <div
                    key={field.field_key}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="font-medium">
                      {formatValue(value, field.field_type)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
