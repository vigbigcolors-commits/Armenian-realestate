const STORAGE_PREFIX = "smartestate_favorites_";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getFavoriteIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isFavorite(userId: string, propertyId: string): boolean {
  return getFavoriteIds(userId).includes(propertyId);
}

export function toggleFavorite(userId: string, propertyId: string): boolean {
  const ids = getFavoriteIds(userId);
  const exists = ids.includes(propertyId);
  const next = exists ? ids.filter((id) => id !== propertyId) : [...ids, propertyId];
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return !exists;
}
