"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { isOnboardingCompleted } from "@/lib/onboarding";

// Tela Splash: laranja primário com o logo, redireciona após ~1.2s.
// - Primeira visita (sem onboarding marcado): vai para /boas-vindas.
// - Demais casos: vai para /login (CKP de auth assume a partir daí).
export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const target = isOnboardingCompleted() ? "/login" : "/boas-vindas";
    const timeout = window.setTimeout(() => router.replace(target), 1200);
    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-primary-500">
      <div className="flex flex-col items-center gap-4 page-enter">
        <Image
          src="/logovambora.svg"
          alt="Vambora Penedo"
          width={120}
          height={120}
          priority
          style={{ width: "auto", height: "auto" }}
        />
        <p className="text-primary-50 text-sm tracking-wide">Vambora Penedo</p>
      </div>
    </main>
  );
}
