import { useAuth } from "@/contexts/useAuth";

const AppHome = () => {
  const { user, profile } = useAuth();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">
        Olá, {profile?.name ?? user?.email}
      </h1>
      <p className="text-muted-foreground">
        Área autenticada — {profile?.role}
      </p>
    </section>
  );
};

export default AppHome;
