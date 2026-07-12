import type { Property, Listing } from "../types";
import { getPropertyPhoto, hasPropertyPhoto, getPropertyDescription, resolvePhotoUrl } from "./images";

/** Фото объявления: нативные /uploads/ или legacy list.am /f/. */
export function filterListingPhotoUrls(urls?: string[] | null): string[] {
  if (!urls?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw || raw.includes("/r/")) continue;
    const ok = raw.includes("/uploads/") || raw.startsWith("/uploads") || raw.includes("/f/");
    if (!ok) continue;
    const url = raw.split("?")[0];
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function pickPrimaryListing(listings: Listing[]): Listing | null {
  if (!listings.length) return null;
  const original = listings.find((l) => l.is_agency === false);
  return original ?? listings[0];
}

export function collectPropertyPhotos(
  property: Property,
  listings: Listing[] = [],
  max = 20,
): string[] {
  const primary = pickPrimaryListing(listings);
  const fromListing = filterListingPhotoUrls(primary?.photo_urls);
  if (fromListing.length) return fromListing.map(resolvePhotoUrl).slice(0, max);

  const fromProperty = filterListingPhotoUrls(property.photo_urls);
  if (fromProperty.length) return fromProperty.map(resolvePhotoUrl).slice(0, max);

  const primaryPhoto = getPropertyPhoto(property);
  return primaryPhoto ? [primaryPhoto] : [];
}

export { getPropertyPhoto, hasPropertyPhoto, getPropertyDescription } from "./images";
