import { api } from "./api";
import type { MutationResponse } from "./common";

export interface RestaurantLocale {
  id: number;
  locale_id: number;
  sort_order: number;
  name: string;
  short_description?: string;
  address?: string;
}

export interface EmbeddedLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string | null;
  sort_order: number;
}

export interface EmbeddedCountry {
  id: number;
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
  locales: EmbeddedLocale[];
}

export interface EmbeddedCity {
  id: number;
  country_id: number;
  code: string;
  sort_order: number;
  locales: EmbeddedLocale[];
}

export interface RestaurantBasicInfo {
  id: number;
  estd: number;
  lat?: number;
  lon?: number;
  country: EmbeddedCountry;
  city: EmbeddedCity;
  phone?: string;
  email?: string;
  logo_url?: string;
  locales: RestaurantLocale[];
}

export interface UpdateRestaurantBasicInfoRequest {
  estd: number;
  country_id: number;
  city_id: number;
  lat?: number;
  lon?: number;
  phone?: string;
  email?: string;
}

export interface AddRestaurantLocaleRequest {
  locale_id: number;
  name: string;
  sort_order: number;
  short_description?: string;
  address?: string;
}

export interface UpdateRestaurantLocaleRequest {
  name: string;
  sort_order: number;
  short_description?: string;
  address?: string;
}

const RESTAURANT_ID = 1;

export const restaurantBasicInfoService = {
  async get(): Promise<{ restaurant_basic_info: RestaurantBasicInfo }> {
    return api.get<{ restaurant_basic_info: RestaurantBasicInfo }>("/restaurant-basic-info");
  },

  async update(body: UpdateRestaurantBasicInfoRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>("/restaurant-basic-info", body);
  },

  async uploadLogo(configId: number, file: File): Promise<MutationResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm<MutationResponse>(`/restaurant-basic-info/logo?config_id=${configId}`, formData);
  },

  async addLocale(body: AddRestaurantLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/restaurant-basic-info/${RESTAURANT_ID}/locales`, body);
  },

  async updateLocale(localeId: number, body: UpdateRestaurantLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/restaurant-basic-info/${RESTAURANT_ID}/locales/${localeId}`, body);
  },

  async removeLocale(localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/restaurant-basic-info/${RESTAURANT_ID}/locales/${localeId}`);
  },
};
