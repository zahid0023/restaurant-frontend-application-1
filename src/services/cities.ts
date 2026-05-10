import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface City {
  id: number;
  country_id: number;
  code?: string;
  sort_order: number;
}

export interface CityLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateCityRequest {
  country_id: number;
  code?: string;
  sort_order: number;
  locales?: CreateCityLocaleRequest[];
}

export interface UpdateCityRequest {
  code?: string;
  sort_order: number;
}

export interface CreateCityLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export const citiesService = {
  async list(params: ListParams = {}): Promise<PageResponse<City>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<City>>(`/cities?${query}`);
  },

  async get(id: number): Promise<{ city: City }> {
    return api.get<{ city: City }>(`/cities/${id}`);
  },

  async create(body: CreateCityRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/cities", body);
  },

  async update(id: number, body: UpdateCityRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/cities/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/cities/${id}`);
  },

  async listLocales(cityId: number, params: ListParams = {}): Promise<PageResponse<CityLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<CityLocale>>(`/cities/${cityId}/locales?${query}`);
  },

  async addLocale(cityId: number, body: CreateCityLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/cities/${cityId}/locales`, body);
  },

  async updateLocale(cityId: number, entryId: number, body: CreateCityLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/cities/${cityId}/locales/${entryId}`, body);
  },

  async removeLocale(cityId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/cities/${cityId}/locales/${entryId}`);
  },
};
