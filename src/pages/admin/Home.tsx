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
    }
  }, [loading, user, recoveryMode, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (loading || !user) return <div className="p-8">Carregando…</div>;

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
