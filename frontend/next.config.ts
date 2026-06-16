import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Configuração do service worker via Serwist (sucessor do next-pwa,
// com suporte oficial ao App Router do Next.js 16).
// O código-fonte do worker vive em src/app/sw.ts e é compilado para
// public/sw.js durante o build.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Desabilita o SW em desenvolvimento para evitar cache agressivo
  // enquanto a equipe está construindo telas.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withSerwist(nextConfig);
