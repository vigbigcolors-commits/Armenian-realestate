import type { Locale } from "../i18n/content";

const API = import.meta.env.VITE_API_URL || "";

function stableHash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface PhotoSource {
  id: string;
  photo_urls?: string[] | null;
  primary_photo_url?: string | null;
}

/** Абсолютный URL фото (нативные /uploads/ или внешние). */
export function resolvePhotoUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API}${url.startsWith("/") ? url : `/${url}`}`;
}

function isValidPhotoUrl(url: string): boolean {
  if (!url || url.includes("/r/")) return false;
  if (url.includes("/uploads/") || url.startsWith("/uploads")) return true;
  return url.includes("/f/");
}

function listingPhotos(urls?: string[] | null): string[] {
  if (!urls?.length) return [];
  return urls.filter(isValidPhotoUrl).map(resolvePhotoUrl);
}

export function hasPropertyPhoto(source: PhotoSource): boolean {
  if (source.primary_photo_url && isValidPhotoUrl(source.primary_photo_url)) return true;
  return listingPhotos(source.photo_urls).length > 0;
}

export function getPropertyPhoto(source: PhotoSource): string | null {
  const photos = listingPhotos(source.photo_urls);
  if (source.primary_photo_url && isValidPhotoUrl(source.primary_photo_url)) {
    return resolvePhotoUrl(source.primary_photo_url);
  }
  if (!photos.length) return null;
  const idx = stableHash(source.id) % photos.length;
  return photos[idx];
}

export function getPropertyDescription(
  descriptionClean: Partial<Record<Locale, string>> | null | undefined,
  descriptionRaw: string | null | undefined,
  locale: Locale,
): string {
  if (descriptionClean?.[locale]) return descriptionClean[locale] as string;
  if (descriptionClean?.ru) return descriptionClean.ru;
  if (descriptionClean?.hy) return descriptionClean.hy;
  if (descriptionClean?.en) return descriptionClean.en;
  return descriptionRaw || "";
}
