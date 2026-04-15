// TEMPORÁRIO — Story 1.8 substitui por AdminShell.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";

const AdminHome = () => {
  const { user, profile, loading, recoveryMode, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (recoveryMode) {
      navigate("/reset-password", { replace: true });
      return;
    }
    // Role-gate: student que digite /admin na URL é redirecionado para /app.
    // ProtectedRoute completo (rota-level) virá na Story 1.8.
    if (profile && profile.role !== "admin") {
      navigate("/app", { replace: true });
    }
  }, [loading, user, profile, recoveryMode, navigate]);

  const handleSignOut = async () => {
    // Navega antes do await para evitar flash de UI autenticada (ver AppHome).
    navigate("/", { replace: true });
    await signOut();
  };

  // Esconde conteúdo de admin enquanto profile carrega ou se role não for admin
  // (evita flash de UI sensível antes do redirect do useEffect rodar).
  if (loading || !user || !profile || profile.role !== "admin") {
    return <div className="p-8">Carregando…</div>;
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Olá, {profile?.name ?? user.email}
      </p>
      <Button onClick={handleSignOut} variant="outline" className="mt-6">
        Sair
      </Button>
    </main>
  );
};

export default AdminHome;
