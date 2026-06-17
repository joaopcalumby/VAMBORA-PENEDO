"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Wallet, User } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/carteira", label: "Carteira", icon: Wallet },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href) ?? false;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-xs transition-colors min-h-[44px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
