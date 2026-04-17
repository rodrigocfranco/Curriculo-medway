import AppShell from "./AppShell";
import ProtectedRoute from "./ProtectedRoute";

const StudentLayout = () => (
  <ProtectedRoute role={["student", "admin"]}>
    <AppShell />
  </ProtectedRoute>
);

export default StudentLayout;
