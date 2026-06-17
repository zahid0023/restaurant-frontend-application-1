export interface RestaurantLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  short_description: string;
  address: string;
  sort_order: number;
  _new?: boolean;
}

export interface EmbeddedLocaleEntry {
  id: number;
  locale_id: number;
  name: string;
}

export interface RestaurantFormState {
  estd: number | "";
  lat: string;
  lon: string;
  country: { id: number; code: string; locales: EmbeddedLocaleEntry[] };
  city: { id: number; code: string; locales: EmbeddedLocaleEntry[] };
  phone: string;
  email: string;
  logo_url: string;
  locales: RestaurantLocaleRow[];
}
