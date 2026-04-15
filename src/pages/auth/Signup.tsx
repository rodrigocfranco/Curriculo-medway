import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignupForm } from "@/components/features/auth/SignupForm";
import { supabase } from "@/lib/supabase";

const Signup = () => {
  const navigate = useNavigate();

  // Se já houver sessão ativa, não faz sentido re-cadastrar. Redireciona para /app.
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) {
        navigate("/app", { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Medway
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-xl px-6 py-10 md:py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Criar minha conta
        </h1>
        <p className="mb-8 text-muted-foreground">
          Cadastro rápido — 7 campos para começar.
        </p>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Signup;
