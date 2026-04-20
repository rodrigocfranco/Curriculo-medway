import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type Testimonial = {
  name: string;
  specialty: string;
  quote: string;
  initials: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ana Beatriz",
    specialty: "Clínica Médica",
    quote:
      "Finalmente consegui entender onde preciso melhorar no meu currículo. O score por instituição fez toda a diferença na minha preparação.",
    initials: "AB",
  },
  {
    name: "Lucas Henrique",
    specialty: "Cirurgia Geral",
    quote:
      "Preenchi em poucos minutos e já tive uma visão clara de como estou posicionado. Recomendo para qualquer residente.",
    initials: "LH",
  },
  {
    name: "Marina Costa",
    specialty: "Pediatria",
    quote:
      "A plataforma é super intuitiva. Me ajudou a organizar minhas experiências e identificar oportunidades que eu nem sabia que contavam pontos.",
    initials: "MC",
  },
];

type SocialProofSectionProps = {
  testimonials?: Testimonial[];
};

const SocialProofSection = ({
  testimonials = TESTIMONIALS,
}: SocialProofSectionProps) => (
  <section id="social-proof" className="py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-[32px]">
        O que dizem nossos alunos
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, index) => (
          <Card
            key={index}
            className="border-border/50 bg-card transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-4 p-6">
              <p className="text-muted-foreground italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10" aria-hidden="true">
                  <AvatarFallback className="bg-accent/10 text-sm font-semibold text-accent">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.specialty}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofSection;
