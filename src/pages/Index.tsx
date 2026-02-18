import { useState, useMemo } from "react";
import { UserProfile, defaultProfile } from "@/lib/types";
import { calculateScores } from "@/lib/calculations";
import CurriculumForm from "@/components/CurriculumForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import { Rocket, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [data, setData] = useState<UserProfile>(defaultProfile);
  const results = useMemo(() => calculateScores(data), [data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center gap-3 py-4">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground leading-tight">ALOFT</h1>
            <p className="text-xs text-muted-foreground">Calculadora Beta de Curriculos para Residência Médica</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setData(defaultProfile)} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        <div className="lg:hidden">
          <ResultsDashboard results={results} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-foreground">ALOFT - Vault (Seus Dados)</h2>
            <CurriculumForm data={data} onChange={setData} />
          </div>

          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-20">
              <ResultsDashboard results={results} />
            </div>
          </div>
        </div>
      </main>
    </div>);

}