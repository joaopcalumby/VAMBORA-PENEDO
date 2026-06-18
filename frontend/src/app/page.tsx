"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isOnboardingCompleted } from "@/lib/onboarding";

// Redireciona a partir da raiz:
// - Primeira visita (sem onboarding marcado): vai para /boas-vindas.
// - Demais casos: vai para /login (CKP de auth assume a partir daí).
export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const target = isOnboardingCompleted() ? "/login" : "/boas-vindas";
    router.replace(target);
  }, [router]);

  // A parte visual de carregamento agora é gerenciada pelo GlobalSplash no layout.tsx
  return null;
}
console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
