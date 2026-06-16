// Source do service worker do Vambora Penedo, compilado pelo Serwist
// para public/sw.js durante o build do Next.js.
//
// Estratégias de cache (defaultCache da @serwist/next/worker):
// - HTML/JS/CSS:   stale-while-revalidate
// - Imagens:       cache-first
// - Fontes:        cache-first
// - Requisições a API: network-first com fallback ao cache
//
// Os tiles do mapa (OSM) caem na regra de imagens — cache-first —
// garantindo o "offline básico" descrito no spec pwa-shell.

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Injetado pelo Serwist no build com a lista de assets do app shell.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
