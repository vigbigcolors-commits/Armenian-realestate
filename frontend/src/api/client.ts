import type { Property, PropertyDetail, PlatformStats } from "../types";



const API = import.meta.env.VITE_API_URL || "";



async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: string }).detail;
    throw new Error(detail || `API error: ${res.status}`);
  }
  return res.json();
}

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}



export interface SearchParams {

  deal_type?: string;

  rooms?: number;

  district?: string;

  price_min?: number;

  price_max?: number;

  area_min?: number;

  area_max?: number;

  q?: string;

  date_from?: string;

  sort?: string;

  limit?: number;

  offset?: number;

}



export interface SearchApplied {
  deal_type?: string;
  rooms?: number | null;
  district?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  property_type?: string | null;
  sort?: string;
  keywords?: string[] | null;
  relaxed?: string[] | null;
  ai?: boolean;
  parsed?: Record<string, unknown> | null;
}

export interface SearchResult {

  items: Property[];

  total: number;

  offset: number;

  limit: number;

  has_more: boolean;

  applied?: SearchApplied;

}



export interface PriceBounds {

  deal_type: string;

  min_price: number;

  max_price: number;

}



function buildQuery(params: SearchParams): string {

  const qs = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {

    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));

  });

  return qs.toString();

}



export function searchProperties(params: SearchParams = {}): Promise<SearchResult> {

  return fetchJson(`/api/properties?${buildQuery(params)}`);

}



export function getPriceBounds(dealType: string): Promise<PriceBounds> {

  return fetchJson(`/api/properties/price-bounds?deal_type=${dealType}`);

}



export function getProperty(id: string): Promise<PropertyDetail> {

  return fetchJson(`/api/properties/${id}`);

}



export function getStats(): Promise<PlatformStats> {

  return fetchJson("/api/stats");

}



export function getDistricts(): Promise<string[]> {

  return fetchJson("/api/districts");

}

export interface UnlockContactResult {
  status: string;
  phone?: string | null;
  amount_amd?: number;
  unlocked?: boolean;
}

export interface ProSubscribeResult {
  status: string;
  plan?: string;
  days?: number;
}

export function unlockContact(body: {
  property_id: string;
  client_token: string;
  payment_method?: string;
}): Promise<UnlockContactResult> {
  return fetchJson("/api/payments/unlock-contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as RequestInit);
}

export function getContactUnlockStatus(
  propertyId: string,
  clientToken: string,
): Promise<UnlockContactResult> {
  return fetchJson(
    `/api/payments/contact-status?property_id=${encodeURIComponent(propertyId)}&client_token=${encodeURIComponent(clientToken)}`,
  );
}

export function subscribePro(body: {
  client_token: string;
  telegram_id?: number;
  payment_method?: string;
}): Promise<ProSubscribeResult> {
  return fetchJson("/api/payments/subscribe-pro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as RequestInit);
}

export interface ListingSubmitPayload {
  deal_type: "sale" | "rent";
  property_type: "apartment" | "house" | "commercial" | "land";
  district: string;
  street?: string;
  rooms?: number;
  floor?: number;
  total_floors?: number;
  area_sqm?: number;
  price_amd: number;
  title: string;
  description: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  hide_phone?: boolean;
  photo_urls: string[];
}

export interface ListingSubmitResult {
  id: string;
  status: string;
  message: string;
  url: string;
}

export async function uploadListingPhoto(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/uploads/photo`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export function submitListing(body: ListingSubmitPayload, token?: string): Promise<ListingSubmitResult> {
  return fetchJson("/api/listings/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  } as RequestInit);
}

export interface SellerAuthResult {
  token: string;
  user: { id: string; name: string; email?: string; phone?: string; role?: string };
}

export interface SellerProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  listings_count: number;
  favorites_count: number;
}

export interface SellerListing {
  id: string;
  title: string;
  district: string;
  deal_type: string;
  current_price_usd: number;
  rooms?: number;
  photo_urls?: string[];
  status: string;
}

export function sellerRegister(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<SellerAuthResult> {
  return fetchJson("/api/sellers/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function sellerLogin(body: { email: string; password: string }): Promise<SellerAuthResult> {
  return fetchJson("/api/sellers/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getSellerProfile(token: string): Promise<SellerProfile> {
  return fetchJson("/api/sellers/me", { headers: authHeaders(token) });
}

export function getSellerListings(token: string): Promise<SellerListing[]> {
  return fetchJson("/api/sellers/my-listings", { headers: authHeaders(token) });
}

export function getSellerFavorites(token: string): Promise<SellerListing[]> {
  return fetchJson("/api/sellers/favorites", { headers: authHeaders(token) });
}

export function addSellerFavorite(token: string, propertyId: string): Promise<{ status: string }> {
  return fetchJson("/api/sellers/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ property_id: propertyId }),
  });
}

export function removeSellerFavorite(token: string, propertyId: string): Promise<{ status: string }> {
  return fetchJson(`/api/sellers/favorites/${propertyId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

