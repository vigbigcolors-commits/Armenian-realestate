export interface LocalizedText {
  hy?: string;
  ru?: string;
  en?: string;
}

export interface Property {
  id: string;
  deal_type: "sale" | "rent";
  property_type: string;
  district: string | null;
  street: string | null;
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  area_sqm: number | null;
  current_price_usd: number | null;
  owner_price_usd: number | null;
  is_owner_verified: boolean;
  duplicate_count: number;
  latitude: number | null;
  longitude: number | null;
  status: string;
  title?: string | null;
  photo_urls?: string[] | null;
  primary_photo_url?: string | null;
  description_raw?: string | null;
  description_clean?: LocalizedText | null;
  published_at?: string | null;
  source_url?: string | null;
  source_site?: string | null;
}

export interface PricePoint {
  recorded_at: string;
  price_usd: number;
  poster_phone?: string | null;
  note?: string | null;
  source_site?: string | null;
}

export interface Listing {
  source_url: string;
  poster_name: string | null;
  poster_phone: string | null;
  price_usd: number | null;
  source_site: string;
  is_agency: boolean;
  scraped_at: string;
  title?: string | null;
  description?: string | null;
  photo_urls?: string[] | null;
}

export interface PropertyDetail {
  property: Property & {
    contact_available?: boolean;
    contact_phone?: string | null;
    contact_email?: string | null;
    contact_name?: string | null;
    building_number?: string | null;
  };
  contact_available?: boolean;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  price_history: PricePoint[];
  all_listings: Listing[];
  duplicate_count: number;
}

export interface PlatformStats {
  active_properties: number;
  total_listings: number;
  duplicates_removed: number;
  verified_owners: number;
}
