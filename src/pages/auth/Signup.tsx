import { Link } from "react-router-dom";
import { SignupForm } from "@/components/features/auth/SignupForm";

const Signup = () => (
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

export default Signup;
