"use client";

import { useLembretes } from "@/lib/hooks/useLembretes";

export function LembretesProvider({ children }: { children: React.ReactNode }) {
  useLembretes();
  return <>{children}</>;
}
