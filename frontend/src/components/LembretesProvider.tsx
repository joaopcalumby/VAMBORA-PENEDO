"use client";

import { useLembretes } from "@/lib/hooks/useLembretes";

// Wrapper invisível que ativa o agendamento de notificações sempre
// que o usuário estiver autenticado. Renderizado no layout do (app).
export function LembretesProvider({ children }: { children: React.ReactNode }) {
  useLembretes();
  return <>{children}</>;
}
