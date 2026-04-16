import { useAuth } from "@/contexts/useAuth";

const AdminHome = () => {
  const { user, profile } = useAuth();
  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold">Instituições</h1>
      <p className="text-sm text-muted-foreground">
        Painel admin — {profile?.name ?? user?.email}
      </p>
    </section>
  );
};

export default AdminHome;
