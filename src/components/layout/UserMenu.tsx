import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/useAuth";

const getInitials = (name?: string | null, email?: string | null) => {
  const source = (name ?? "").trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]!.toUpperCase());
    return initials.join("");
  }
  const fallback = (email ?? "").trim();
  return fallback ? fallback[0]!.toUpperCase() : "?";
};

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const signingOutRef = useRef(false);

  const emailText = user?.email ?? "";
  const nameText = profile?.name?.trim() || "";
  const displayName = nameText || emailText;
  const initials = getInitials(profile?.name, user?.email);
  const menuLabel = displayName
    ? `Menu de ${displayName}`
    : "Menu do usuário";

  const handleSignOut = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    navigate("/", { replace: true });
    try {
      await signOut();
    } catch (err) {
      signingOutRef.current = false;
      console.error("[UserMenu] signOut failed", err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={menuLabel}
          data-testid="user-menu"
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {displayName ? (
          <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        ) : null}
        {emailText && emailText !== displayName ? (
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
            {emailText}
          </DropdownMenuLabel>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/conta">Minha conta</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
