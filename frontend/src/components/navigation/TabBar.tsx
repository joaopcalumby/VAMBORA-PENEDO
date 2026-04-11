"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, User } from "lucide-react";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Rotas", href: "/rotas", icon: Map },
  { name: "Perfil", href: "/perfil", icon: User },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 h-16 w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-lg">
      <div className="grid h-full grid-cols-3 px-2 font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group inline-flex flex-col items-center justify-center rounded-xl px-5 hover:bg-gray-50"
            >
              <Icon
                className={`mb-1 h-6 w-6 ${isActive ? "text-green-500" : "text-gray-500 group-hover:text-green-500"}`}
              />
              <span
                className={`text-xs ${isActive ? "text-green-500" : "text-gray-500 group-hover:text-green-500"}`}
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