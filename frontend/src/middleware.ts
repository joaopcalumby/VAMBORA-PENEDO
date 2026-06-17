import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas autenticadas — deixadas como referência para o checkpoint
// de auth (CKP16), que vai consultar o cookie de sessão NextAuth
// e redirecionar para /login quando ausente.
const _PROTECTED_PREFIXES = [
  "/inicio",
  "/mapa",
  "/carteira",
  "/perfil",
  "/linha",
  "/busca",
  "/favoritos",
  "/tarifas",
];

export function middleware(_req: NextRequest) {
  // Sem checagem por enquanto — desbloqueia o desenvolvimento das
  // telas. A regra real entra em CKP16, depois que a sessão existir.
  return NextResponse.next();
}

export const config = {
  // Exclui APIs internas, assets estáticos, manifesto e service worker.
  matcher: [
    "/((?!api|_next/static|_next/image|icons|favicon.ico|logovambora.svg|manifest.webmanifest|sw.js).*)",
  ],
};
