import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Backend FastAPI — INTERNAL_API_URL é preferido em deploy (rede interna);
// fallback para a URL pública (mesmo container/máquina em dev).
const BACKEND_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

type BackendTokenResponse = {
  access_token: string;
  token_type: string;
  role: "user" | "driver" | "admin";
  needs_completion: boolean;
};

async function backendLogin(
  email: string,
  password: string
): Promise<BackendTokenResponse | null> {
  const resp = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) return null;
  return (await resp.json()) as BackendTokenResponse;
}

async function backendGoogle(
  idToken: string
): Promise<BackendTokenResponse | null> {
  const resp = await fetch(`${BACKEND_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!resp.ok) return null;
  return (await resp.json()) as BackendTokenResponse;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const data = await backendLogin(credentials.email, credentials.password);
        if (!data) return null;
        return {
          id: credentials.email,
          email: credentials.email,
          backendToken: data.access_token,
          role: data.role,
          needsCompletion: data.needs_completion,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Para Google, trocamos o id_token pelo JWT do nosso backend.
      if (account?.provider === "google" && account.id_token) {
        const data = await backendGoogle(account.id_token);
        if (!data) return false;
        user.backendToken = data.access_token;
        user.role = data.role;
        user.needsCompletion = data.needs_completion;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = user.backendToken;
        token.role = user.role;
        token.needsCompletion = user.needsCompletion;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken;
      session.role = token.role;
      session.needsCompletion = token.needsCompletion;
      if (session.user) {
        session.user.email = (token.email as string | null) ?? session.user.email;
        session.user.name = (token.name as string | null) ?? session.user.name;
      }
      return session;
    },
  },
};
