import { Link } from "react-router-dom";
import { UserPlus, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: UserPlus,
    title: "Cadastre-se em 1 minuto",
    description: "7 campos simples e você já pode começar",
  },
  {
    icon: FileText,
    title: "Preencha seu currículo",
    description: "Seções organizadas com salvamento automático",
  },
  {
    icon: BarChart3,
    title: "Veja seu score por instituição",
    description: "Dashboard com gap analysis por categoria",
  },
] as const;

const HowItWorksSection = () => (
  <section id="como-funciona" className="bg-secondary/30 py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-[32px]">
        Como funciona
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card
            key={step.title}
            className="border-border/50 bg-card transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <step.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-accent">
                Passo {index + 1}
              </span>
              <h3 className="text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="mb-4 text-lg font-medium text-foreground">
          Pronto para começar?
        </p>
        <Button asChild size="lg" className="min-h-[44px] min-w-[44px]">
          <Link to="/signup">Criar minha conta</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
