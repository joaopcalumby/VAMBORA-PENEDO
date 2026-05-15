export type StoredRouteCard = {
  id: number;
  category: string;
  title: string;
  schedule: string;
  href: string;
};

const FAVORITES_KEY = "vambora:favorite-routes";
const RECENTS_KEY = "vambora:recent-routes";
const MAX_RECENTS = 6;

function getScopedKey(baseKey: string, userKey?: string | null) {
  const scope = userKey?.trim().toLowerCase();

  return scope ? `${baseKey}:${scope}` : `${baseKey}:anonymous`;
}

function parseRoutes(raw: string | null): StoredRouteCard[] {
  if (!raw) {
    return [];
  }

  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRoutes(key: string, routes: StoredRouteCard[]) {
  localStorage.setItem(key, JSON.stringify(routes));
}

export function getFavoriteRoutes(userKey?: string | null): StoredRouteCard[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRoutes(localStorage.getItem(getScopedKey(FAVORITES_KEY, userKey)));
}

export function getRecentRoutes(userKey?: string | null): StoredRouteCard[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRoutes(localStorage.getItem(getScopedKey(RECENTS_KEY, userKey)));
}

export function isRouteFavorite(routeId: number, userKey?: string | null): boolean {
  return getFavoriteRoutes(userKey).some((route) => route.id === routeId);
}

export function toggleFavoriteRoute(route: StoredRouteCard, userKey?: string | null): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const storageKey = getScopedKey(FAVORITES_KEY, userKey);
  const favorites = getFavoriteRoutes(userKey);
  const existingIndex = favorites.findIndex((item) => item.id === route.id);

  if (existingIndex >= 0) {
    const updated = favorites.filter((item) => item.id !== route.id);
    saveRoutes(storageKey, updated);
    return false;
  }

  saveRoutes(storageKey, [route, ...favorites]);
  return true;
}

export function addRecentRoute(route: StoredRouteCard, userKey?: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getScopedKey(RECENTS_KEY, userKey);
  const recentRoutes = getRecentRoutes(userKey);
  const withoutCurrent = recentRoutes.filter((item) => item.id !== route.id);
  const updated = [route, ...withoutCurrent].slice(0, MAX_RECENTS);
  saveRoutes(storageKey, updated);
}