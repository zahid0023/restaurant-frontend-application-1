import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface Country {
  id: number;
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
}

export interface CountryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateCountryRequest {
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
  locales?: CreateLocaleRequest[];
}

export interface UpdateCountryRequest {
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
}

export interface CreateLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export const countriesService = {
  async list(params: ListParams = {}): Promise<PageResponse<Country>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    return api.get<PageResponse<Country>>(`/countries?${query}`);
  },

  async get(id: number): Promise<{ country: Country }> {
    return api.get<{ country: Country }>(`/countries/${id}`);
  },

  async create(body: CreateCountryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/countries", body);
  },

  async update(id: number, body: UpdateCountryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/countries/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/countries/${id}`);
  },

  async listLocales(
    countryId: number,
    params: ListParams = {},
  ): Promise<PageResponse<CountryLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    return api.get<PageResponse<CountryLocale>>(
      `/countries/${countryId}/locales?${query}`,
    );
  },

  async addLocale(
    countryId: number,
    body: CreateLocaleRequest,
  ): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/countries/${countryId}/locales`, body);
  },

  async updateLocale(
    countryId: number,
    localeEntryId: number,
    body: CreateLocaleRequest,
  ): Promise<MutationResponse> {
    return api.put<MutationResponse>(
      `/countries/${countryId}/locales/${localeEntryId}`,
      body,
    );
  },

  async removeLocale(
    countryId: number,
    localeEntryId: number,
  ): Promise<MutationResponse> {
    return api.delete<MutationResponse>(
      `/countries/${countryId}/locales/${localeEntryId}`,
    );
  },
};
