import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface DiningSpaceLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface DiningSpace {
  id: number;
  dining_space_type_id: number;
  floor_id: number | null;
  code: string;
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
  locales: DiningSpaceLocale[];
}

export interface CreateDiningSpaceLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateDiningSpaceLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDiningSpaceRequest {
  dining_space_type_id: number;
  floor_id?: number | null;
  code: string;
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
  locales?: CreateDiningSpaceLocaleRequest[];
}

export interface UpdateDiningSpaceRequest {
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
}

export const diningSpacesService = {
  async list(params: ListParams = {}): Promise<PageResponse<DiningSpace>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<DiningSpace>>(`/dining-spaces?${query}`);
  },

  async get(id: number): Promise<{ dining_space: DiningSpace }> {
    return api.get<{ dining_space: DiningSpace }>(`/dining-spaces/${id}`);
  },

  async create(body: CreateDiningSpaceRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/dining-spaces", body);
  },

  async update(id: number, body: UpdateDiningSpaceRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dining-spaces/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dining-spaces/${id}`);
  },

  async addLocale(spaceId: number, body: CreateDiningSpaceLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dining-spaces/${spaceId}/locales`, body);
  },

  async updateLocale(spaceId: number, localeId: number, body: UpdateDiningSpaceLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dining-spaces/${spaceId}/locales/${localeId}`, body);
  },

  async removeLocale(spaceId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dining-spaces/${spaceId}/locales/${localeId}`);
  },
};
