import { useState, useMemo } from "react";
import { CurriculumData, defaultData } from "@/lib/types";
import { calculateAll } from "@/lib/calculations";
import CurriculumForm from "@/components/CurriculumForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import { Stethoscope } from "lucide-react";

export default function Index() {
  const [data, setData] = useState<CurriculumData>(defaultData);
  const results = useMemo(() => calculateAll(data), [data]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center gap-3 py-4">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Calculadora de Currículo</h1>
            <p className="text-xs text-muted-foreground">Residência Médica</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Results first on mobile for immediate feedback */}
        <div className="lg:hidden">
          <ResultsDashboard results={results} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Seus Dados</h2>
            <CurriculumForm data={data} onChange={setData} />
          </div>

          {/* Results sidebar on desktop */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-20">
              <ResultsDashboard results={results} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
