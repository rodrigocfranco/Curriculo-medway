import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/useAuth";

import UserMenu from "./UserMenu";

const STUDENT_NAV = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/curriculo", label: "Currículo", end: false },
] as const;

export const AppShell = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {isAdmin && (
        <div className="border-b border-accent/30 bg-accent/5">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground md:px-6">
            <ArrowLeft className="h-3 w-3" />
            <Link to="/admin" className="hover:text-foreground transition-colors">
              Voltar ao painel admin
            </Link>
            <span>— Você está vendo a plataforma como aluno</span>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
          <div className="flex items-center gap-4">
            <Link
              to="/app"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Medway
            </Link>
            <nav
              aria-label="Principal"
              className="hidden items-center gap-3 text-sm md:flex"
            >
              {STUDENT_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "transition-colors",
                      isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <UserMenu />
        </div>
        {/* Mobile nav */}
        <nav
          aria-label="Principal"
          className="flex items-center gap-4 border-t border-border px-4 text-sm md:hidden"
        >
          {STUDENT_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "py-2 transition-colors",
                  isActive
                    ? "border-b-2 border-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
