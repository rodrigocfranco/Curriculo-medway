import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent/20">
    {/* Decorative shapes */}
    <div className="absolute inset-0 opacity-10" aria-hidden="true">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent" />
      <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-accent/50" />
      <div className="absolute right-1/4 top-1/2 h-48 w-48 rotate-45 rounded-lg bg-white/10" />
    </div>

    <div className="relative mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-5 md:items-center md:py-24">
      {/* Text — 60% (3 of 5 cols) */}
      <div className="flex flex-col items-start gap-6 md:col-span-3">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white md:text-[48px] md:leading-[56px]">
          Descubra como está seu currículo para as maiores instituições de
          residência do Brasil
        </h1>
        <p className="max-w-xl text-lg text-white/80">
          Em 10 minutos você tem seu score nas maiores instituições de
          residência — com regras oficiais e gap analysis por categoria.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg" className="min-h-[44px] min-w-[44px]">
            <Link to="/signup">Começar</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="min-h-[44px] min-w-[44px] border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>
        <p className="text-sm text-white/60">
          Já tem conta?{" "}
          <Link to="/login" className="underline hover:text-white/90">
            Fazer login
          </Link>
        </p>
      </div>

      {/* Visual — 40% (2 of 5 cols) */}
      <div className="flex items-center justify-center md:col-span-2" aria-hidden="true">
        <div className="relative h-64 w-full max-w-xs md:h-80">
          {/* Decorative dashboard illustration */}
          <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-sm" />
          <div className="absolute inset-3 rounded-xl bg-white/15 p-4">
            <div className="mb-3 h-3 w-24 rounded bg-white/30" />
            <div className="mb-2 h-2 w-full rounded bg-white/20" />
            <div className="mb-4 h-2 w-3/4 rounded bg-white/20" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-white/10" />
              ))}
            </div>
            <div className="mt-3 h-8 w-full rounded-lg bg-accent/30" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
