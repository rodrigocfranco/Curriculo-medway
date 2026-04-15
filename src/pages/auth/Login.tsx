import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { useAuth } from "@/contexts/useAuth";

const Login = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!profile) {
      // user truthy + profile null + loading false = órfão (RLS denial / sem
      // row em profiles). Não redirecionar para /app sem role definida (admin
      // seria rebaixado para /app silenciosamente). Deslogar para forçar
      // re-login limpo; loop /login ↔ /app fica fechado.
      void signOut();
      return;
    }
    navigate(profile.role === "admin" ? "/admin" : "/app", { replace: true });
  }, [loading, user, profile, navigate, signOut]);

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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="mb-8 text-muted-foreground">
          Acesse sua área autenticada.
        </p>
        <LoginForm />
      </section>
    </main>
  );
};

export default Login;
