import { Link, Outlet } from "react-router-dom";

import UserMenu from "./UserMenu";

export const AppShell = () => (
  <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur md:h-16">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link
          to="/app"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Medway
        </Link>
        <div
          data-testid="specialty-selector-slot"
          className="flex-1 px-4"
          aria-hidden="true"
        />
        <UserMenu />
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Outlet />
    </main>
  </div>
);

export default AppShell;
