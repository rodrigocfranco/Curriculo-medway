// TEMPORÁRIO — Story 1.8 substitui por AppShell + Avatar menu.
// Mantém CTA "Sair" para satisfazer AC2 desta story.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";

const AppHome = () => {
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
    }
  }, [loading, user, recoveryMode, navigate]);

  const handleSignOut = async () => {
    // Navega imediatamente para evitar flash de UI autenticada entre o
    // resolve do signOut e o listener SIGNED_OUT (que limpa user/profile do
    // contexto). signOut continua em background; "/" é público.
    navigate("/", { replace: true });
    await signOut();
  };

  if (loading || !user) return <div className="p-8">Carregando…</div>;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">
        Olá, {profile?.name ?? user.email}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Área autenticada — {profile?.role ?? "…"}
      </p>
      <Button onClick={handleSignOut} variant="outline" className="mt-6">
        Sair
      </Button>
    </main>
  );
};

export default AppHome;
