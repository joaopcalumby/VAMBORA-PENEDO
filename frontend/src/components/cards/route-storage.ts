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

export function getFavoriteRoutes(): StoredRouteCard[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRoutes(localStorage.getItem(FAVORITES_KEY));
}

export function getRecentRoutes(): StoredRouteCard[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRoutes(localStorage.getItem(RECENTS_KEY));
}

export function isRouteFavorite(routeId: number): boolean {
  return getFavoriteRoutes().some((route) => route.id === routeId);
}

export function toggleFavoriteRoute(route: StoredRouteCard): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const favorites = getFavoriteRoutes();
  const existingIndex = favorites.findIndex((item) => item.id === route.id);

  if (existingIndex >= 0) {
    const updated = favorites.filter((item) => item.id !== route.id);
    saveRoutes(FAVORITES_KEY, updated);
    return false;
  }

  saveRoutes(FAVORITES_KEY, [route, ...favorites]);
  return true;
}

export function addRecentRoute(route: StoredRouteCard) {
  if (typeof window === "undefined") {
    return;
  }

  const recentRoutes = getRecentRoutes();
  const withoutCurrent = recentRoutes.filter((item) => item.id !== route.id);
  const updated = [route, ...withoutCurrent].slice(0, MAX_RECENTS);
  saveRoutes(RECENTS_KEY, updated);
}