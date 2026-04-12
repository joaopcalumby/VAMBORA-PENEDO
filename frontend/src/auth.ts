import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl || !credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanApiUrl = apiUrl.replace(/\/$/, "");
        const response = await fetch(`${cleanApiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        return {
          id: String(credentials.email),
          name: data.user?.name ? String(data.user.name) : null,
          email: data.user?.email ? String(data.user.email) : String(credentials.email),
          accessToken: data.access_token || data.token || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.accessToken = (user as { accessToken?: string | null }).accessToken || null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? null;
      }
      session.accessToken = (token.accessToken as string | null) || null;
      return session;
    },
  },
};