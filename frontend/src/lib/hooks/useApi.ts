"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { api, ApiOptions } from "@/lib/api";

// Hook simples: devolve uma versão do `api` que já injeta o JWT do
// backend a partir da sessão NextAuth. Use em qualquer client component
// que precise chamar endpoints autenticados.
export function useApi() {
  const { data: session } = useSession();
  const token = session?.backendToken ?? null;

  return useCallback(
    <T = unknown>(path: string, options: Omit<ApiOptions, "token"> = {}) =>
      api<T>(path, { ...options, token }),
    [token]
  );
}
