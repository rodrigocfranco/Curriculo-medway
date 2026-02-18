import { InstitutionResult } from "@/lib/types";
import InstitutionCard from "./InstitutionCard";

interface Props {
  results: InstitutionResult[];
}

export default function ResultsDashboard({ results }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Resultados por Instituição</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r) => (
          <InstitutionCard key={r.name} result={r} />
        ))}
      </div>
    </div>
  );
}
