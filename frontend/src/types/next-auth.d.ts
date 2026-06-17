import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  // Sessão devolvida por useSession() / getSession() — inclui o JWT do
  // nosso backend FastAPI, a role e a flag de cadastro incompleto.
  interface Session {
    backendToken?: string;
    role?: "user" | "driver" | "admin";
    needsCompletion?: boolean;
  }

  interface User {
    backendToken?: string;
    role?: "user" | "driver" | "admin";
    needsCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    role?: "user" | "driver" | "admin";
    needsCompletion?: boolean;
  }
}
