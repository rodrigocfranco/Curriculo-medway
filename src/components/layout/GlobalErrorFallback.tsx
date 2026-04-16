import { Button } from "@/components/ui/button";

interface GlobalErrorFallbackProps {
  resetError?: () => void;
}

export const GlobalErrorFallback = ({ resetError }: GlobalErrorFallbackProps) => (
  <div
    role="alert"
    className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 text-center font-sans text-foreground"
  >
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Nossa equipe foi notificada. Tente novamente em instantes ou volte para o
        início.
      </p>
      <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center">
        {resetError ? (
          <Button onClick={resetError} variant="default">
            Tentar novamente
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <a href="/">Voltar ao início</a>
        </Button>
      </div>
    </div>
  </div>
);

export default GlobalErrorFallback;
