"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { api, ApiOptions } from "@/lib/api";

export function useApi() {
  const { data: session } = useSession();
  const token = session?.backendToken ?? null;

  return useCallback(
    <T = unknown>(path: string, options: Omit<ApiOptions, "token"> = {}) =>
      api<T>(path, { ...options, token }),
    [token]
  );
}
