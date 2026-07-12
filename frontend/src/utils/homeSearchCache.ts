import type { Property, PlatformStats } from "../types";

/** Увеличивайте при смене логики фильтров/цен — сбрасывает устаревший кэш сессии. */
export const HOME_SEARCH_CACHE_VERSION = 5;

export interface HomeSearchCache {
  version: number;
  queryKey: string;
  dealType: "rent" | "sale";
  query: string;
  district: string;
  rooms: number | "";
  priceMin: number;
  priceMax: number;
  priceBounds: { min: number; max: number };
  showMap: boolean;
  properties: Property[];
  total: number;
  hasMore: boolean;
  stats: PlatformStats | null;
  scrollY: number;
}

let cache: HomeSearchCache | null = null;

export function getHomeSearchCache(): HomeSearchCache | null {
  if (cache && cache.version !== HOME_SEARCH_CACHE_VERSION) {
    cache = null;
  }
  return cache;
}

export function setHomeSearchCache(next: Omit<HomeSearchCache, "version">): void {
  cache = { ...next, version: HOME_SEARCH_CACHE_VERSION };
}

export function clearHomeSearchCache(): void {
  cache = null;
}
