"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isOnboardingCompleted } from "@/lib/onboarding";

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const target = isOnboardingCompleted() ? "/login" : "/boas-vindas";
    router.replace(target);
  }, [router]);

  return null;
}
console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
