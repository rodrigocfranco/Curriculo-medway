import { useState, useMemo } from "react";
import { UserProfile, defaultProfile } from "@/lib/types";
import { calculateScores } from "@/lib/calculations";
import CurriculumForm from "@/components/CurriculumForm";
import DiagnosticDashboard from "@/components/DiagnosticDashboard";
import LeadGateModal from "@/components/LeadGateModal";
import { Rocket, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [data, setData] = useState<UserProfile>(defaultProfile);
  const [showModal, setShowModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const results = useMemo(() => calculateScores(data), [data]);

  const handleReset = () => {
    setData(defaultProfile);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center gap-3 py-4">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground leading-tight">ALOFT</h1>
            <p className="text-xs text-muted-foreground">Diagnóstico Curricular para Residência Médica</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {!showResults ? (
          <>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Preencha Seu Currículo</h2>
              <p className="text-sm text-muted-foreground">
                Informe seus dados acadêmicos para gerar um diagnóstico detalhado com ranking, tabelas e recomendações personalizadas.
              </p>
              <CurriculumForm data={data} onChange={setData} />
            </div>

            <div className="flex justify-center pt-4 pb-8">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold gap-2 shadow-lg"
                onClick={() => setShowModal(true)}
              >
                <Rocket className="h-5 w-5" />
                Gerar Meu Diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <DiagnosticDashboard results={results} data={data} />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 pb-8">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Refazer Diagnóstico
              </Button>
            </div>
          </>
        )}
      </main>

      <LeadGateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={() => {
          setShowModal(false);
          setShowResults(true);
        }}
        results={results}
      />
    </div>
  );
}
