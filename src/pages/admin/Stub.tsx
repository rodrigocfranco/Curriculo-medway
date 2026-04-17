interface AdminStubProps {
  title: string;
}

export const AdminStub = ({ title }: AdminStubProps) => (
  <section>
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Em breve — funcionalidade prevista para o Epic 3.
    </p>
  </section>
);

export const RegrasStub = () => <AdminStub title="Regras" />;
export const HistoricoStub = () => <AdminStub title="Histórico" />;

export default AdminStub;
