"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, User, Wallet } from "lucide-react";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Rotas", href: "/rotas", icon: Map },
  {name: "Carteira", href: "/carteira", icon: Wallet },
  { name: "Perfil", href: "/profile", icon: User },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-50 h-16 w-[calc(100%-0.75rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-lg sm:w-[calc(100%-1rem)]">
      <div className="grid h-full grid-cols-4 px-1.5 font-medium sm:px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group inline-flex flex-col items-center justify-center rounded-xl px-2 hover:bg-gray-50 sm:px-3"
            >
              <Icon
                className={`mb-1 h-5 w-5 sm:h-6 sm:w-6 ${isActive ? "text-green-500" : "text-gray-500 group-hover:text-green-500"}`}
              />
              <span
                className={`text-[10px] sm:text-xs ${isActive ? "text-green-500" : "text-gray-500 group-hover:text-green-500"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}