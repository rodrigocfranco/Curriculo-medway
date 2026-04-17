import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const ULTIMA_ATUALIZACAO = "abril de 2026";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const LegalPageLayout = ({ title, description, children }: LegalPageLayoutProps) => {
  useEffect(() => {
    document.title = `${title} — Medway Currículo`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      const tag = document.createElement("meta");
      tag.name = "description";
      tag.content = description;
      document.head.appendChild(tag);
    }
  }, [title, description]);

  return (
  <main className="min-h-screen bg-background font-sans text-foreground">
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-16">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </Link>

      <article className="space-y-2 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-medium [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p]:mb-4 [&_p]:text-base [&_p]:leading-relaxed [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </article>
    </div>
  </main>
  );
};

export default LegalPageLayout;
