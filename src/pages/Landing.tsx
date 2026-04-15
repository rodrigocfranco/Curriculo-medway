import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => (
  <main className="min-h-screen bg-background font-sans text-foreground">
    <section className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-16 md:py-24">
      <h1 className="text-[40px] font-bold leading-tight tracking-tight md:text-[48px] md:leading-[56px]">
        Descubra como está seu currículo para as maiores instituições de residência do Brasil
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Preencha seu currículo em minutos e veja seu score em até 11 programas — com regras oficiais e gap analysis por instituição.
      </p>
      <Button asChild size="lg">
        <Link to="/signup">Começar</Link>
      </Button>
    </section>
  </main>
);

export default Landing;
