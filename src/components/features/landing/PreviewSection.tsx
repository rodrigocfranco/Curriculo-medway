import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Target,
    title: "Score por instituição",
    description:
      "Saiba exatamente onde você está forte e onde precisa melhorar em cada programa de residência.",
  },
  {
    icon: TrendingUp,
    title: "Gap analysis detalhado",
    description:
      "Visualize categoria por categoria o que falta para maximizar sua pontuação.",
  },
  {
    icon: ShieldCheck,
    title: "Regras oficiais dos editais",
    description:
      "Critérios extraídos diretamente dos editais, sempre atualizados pela equipe Medway.",
  },
  {
    icon: Clock,
    title: "Salvamento automático",
    description:
      "Preencha no seu ritmo — seu progresso é salvo automaticamente a cada alteração.",
  },
  {
    icon: Sparkles,
    title: "Plataforma em evolução",
    description:
      "Novas instituições e funcionalidades são adicionadas continuamente.",
  },
  {
    icon: BookOpen,
    title: "Gratuito e sem compromisso",
    description:
      "Cadastre-se, preencha seu currículo e veja seus resultados sem nenhum custo.",
  },
] as const;

const PreviewSection = () => (
  <section id="preview" className="py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="mb-4 text-center text-2xl font-bold tracking-tight text-foreground md:text-[32px]">
        Por que usar o Currículo Medway?
      </h2>
      <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
        Tudo o que você precisa para entender sua competitividade nas principais
        instituições de residência do país.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <Card
            key={benefit.title}
            className="border-border/50 bg-card transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <benefit.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default PreviewSection;
