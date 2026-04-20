import { Link } from "react-router-dom";

const FooterSection = () => {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p className="font-semibold text-foreground">Medway</p>

        <nav aria-label="Links do rodapé" className="flex flex-col items-center gap-2 md:flex-row md:gap-6">
          <Link
            to="/termos"
            className="min-h-[44px] min-w-[44px] inline-flex items-center hover:text-foreground transition-colors"
          >
            Termos de Uso
          </Link>
          <Link
            to="/privacidade"
            className="min-h-[44px] min-w-[44px] inline-flex items-center hover:text-foreground transition-colors"
          >
            Política de Privacidade
          </Link>
          <a
            href="https://medway.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center hover:text-foreground transition-colors"
          >
            medway.com.br
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </nav>

        <p>&copy; {year} Medway</p>
      </div>
    </footer>
  );
};

export default FooterSection;
