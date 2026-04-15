import { Link } from "react-router-dom";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

const ForgotPassword = () => (
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
        Recuperar senha
      </h1>
      <p className="mb-8 text-muted-foreground">
        Informe seu email e enviaremos um link para definir uma nova senha.
      </p>
      <ForgotPasswordForm />
    </section>
  </main>
);

export default ForgotPassword;
