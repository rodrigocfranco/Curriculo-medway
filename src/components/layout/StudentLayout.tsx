import AppShell from "./AppShell";
import ProtectedRoute from "./ProtectedRoute";

const StudentLayout = () => (
  <ProtectedRoute role="student">
    <AppShell />
  </ProtectedRoute>
);

export default StudentLayout;
