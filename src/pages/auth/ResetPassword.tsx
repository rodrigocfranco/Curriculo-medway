import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { useAuth } from "@/contexts/useAuth";

const ResetPassword = () => {
  const { user, loading, recoveryMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    // Gate estrito: só aceita sessão PASSWORD_RECOVERY. Evita que usuário já
    // autenticado (fora do fluxo de recovery) troque senha sem reautenticação —
    // caminho correto para esse caso é AccountSettings (Story 5.2).
    if (!recoveryMode) {
      toast.error("Link inválido ou expirado. Solicite um novo.");
      navigate("/forgot-password", { replace: true });
    }
  }, [loading, recoveryMode, navigate]);

  if (loading || !recoveryMode || !user)
    return <div className="p-8">Carregando…</div>;

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Medway
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-md px-6 py-10 md:py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Definir nova senha
        </h1>
        <p className="mb-8 text-muted-foreground">
          Escolha uma senha forte que você ainda não usou.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
};

export default ResetPassword;
