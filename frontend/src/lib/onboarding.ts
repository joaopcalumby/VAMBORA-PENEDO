// Persistência de "primeiro acesso" via localStorage.
//
// O middleware Next.js executa no servidor e NÃO tem acesso a
// localStorage — por isso a decisão de mostrar onboarding fica
// no cliente (tela Splash e useEffect dela).

const KEY = "vambora.onboardingCompleted";

export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) === "true";
}

export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, "true");
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
