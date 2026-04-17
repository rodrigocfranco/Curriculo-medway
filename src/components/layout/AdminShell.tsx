import { Link, NavLink, Outlet } from "react-router-dom";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import UserMenu from "./UserMenu";

const ADMIN_TABS = [
  { to: "/admin", label: "Instituições", end: true },
  { to: "/admin/regras", label: "Regras", end: false },
  { to: "/admin/leads", label: "Leads", end: false },
  { to: "/admin/historico", label: "Histórico", end: false },
] as const;

export const AdminShell = () => (
  <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur md:h-16">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            Medway
          </Link>
          <Badge variant="secondary">Admin</Badge>
        </div>
        <nav
          aria-label="Admin"
          className="hidden items-center gap-4 text-sm md:flex"
        >
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden gap-1.5 text-muted-foreground md:inline-flex">
            <Link to="/app">
              <Eye className="h-4 w-4" />
              Ver como aluno
            </Link>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
    <div
      role="note"
      className="bg-warning/10 text-warning-foreground md:hidden"
    >
      <div className="mx-auto max-w-screen-2xl px-3 py-2 text-xs">
        Painel admin otimizado para desktop
      </div>
    </div>
    <main className="mx-auto max-w-screen-2xl px-3 py-3 md:px-4 md:py-4">
      <Outlet />
    </main>
  </div>
);

export default AdminShell;
