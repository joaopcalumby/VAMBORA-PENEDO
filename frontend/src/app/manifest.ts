import type { MetadataRoute } from "next";

// Web App Manifest do Vambora Penedo (PWA).
// Servido em /manifest.webmanifest pela rota de Metadata do Next.js.
//
// theme_color usa o tom 500 da paleta deep-saffron (#f99006, PRD §6.2)
// para a barra de status do app instalado.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vambora Penedo",
    short_name: "Vambora",
    description:
      "Linhas, horários, rotas e pontos do transporte público de Penedo–AL num só lugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#f99006",
    lang: "pt-BR",
    categories: ["travel", "navigation", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
