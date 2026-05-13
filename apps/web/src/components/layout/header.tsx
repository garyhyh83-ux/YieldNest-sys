"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-6 ml-64">
      <div>
        <h2 className="text-sm font-medium text-[var(--color-muted)]">
          Welcome to YieldNest
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
