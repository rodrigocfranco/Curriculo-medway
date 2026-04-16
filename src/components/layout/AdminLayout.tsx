import AdminShell from "./AdminShell";
import ProtectedRoute from "./ProtectedRoute";

const AdminLayout = () => (
  <ProtectedRoute role="admin">
    <AdminShell />
  </ProtectedRoute>
);

export default AdminLayout;
