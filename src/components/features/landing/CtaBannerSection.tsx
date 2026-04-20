import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CtaBannerSection = () => (
  <section className="bg-gradient-to-br from-primary via-primary to-accent/30 py-16 text-center">
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-primary-foreground md:text-[32px]">
        Pronto para descobrir seu score?
      </h2>
      <Button
        asChild
        size="lg"
        variant="secondary"
        className="min-h-[44px] min-w-[44px]"
      >
        <Link to="/signup">Começar agora</Link>
      </Button>
    </div>
  </section>
);

export default CtaBannerSection;
