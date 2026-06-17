"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bus, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markOnboardingCompleted } from "@/lib/onboarding";

const SLIDES = [
  {
    icon: Bus,
    title: "Consulte ônibus, vans e balsas de Penedo num só lugar.",
    body: "Linhas, horários, rotas e pontos sempre à mão.",
  },
  {
    icon: MapPin,
    title: "Veja rotas no mapa e quando passa o próximo.",
    body: "Os horários são estimativas baseadas em fonte oficial e podem variar.",
  },
  {
    icon: Bell,
    title: "Ative lembretes e salve seus trajetos.",
    body: "Vamos pedir permissões de localização e notificação para isso.",
  },
] as const;

export default function BoasVindasPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  async function advance() {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    await requestPermissions();
    markOnboardingCompleted();
    router.replace("/login");
  }

  function skip() {
    markOnboardingCompleted();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="rounded-full bg-primary-50 p-6 text-primary-700 dark:bg-primary-900 dark:text-primary-200">
          <Icon className="h-12 w-12" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold leading-snug text-balance">{slide.title}</h1>
        <p className="text-muted-foreground text-balance">{slide.body}</p>
      </div>

      <div role="tablist" aria-label="Progresso do onboarding" className="flex justify-center gap-2 my-6">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            role="tab"
            aria-selected={i === index}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i === index ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={skip}>Pular</Button>
        <Button onClick={advance}>{isLast ? "Concluir" : "Avançar"}</Button>
      </div>
    </div>
  );
}

async function requestPermissions(): Promise<void> {
  if (typeof window === "undefined") return;

  if ("geolocation" in navigator) {
    await new Promise<void>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        () => resolve(),
        { timeout: 5000 }
      )
    );
  }

  if ("Notification" in window && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // ignore
    }
  }
}
