import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface DiningSpace {
  id: number;
  dining_space_type_id: number;
  floor_id: number | null;
  code: string;
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
}

export interface DiningSpaceLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDiningSpaceLocaleRequest {
  locale_id: number;
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
  dining_space_type_id: number;
  floor_id?: number | null;
  code: string;
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
}

export const diningSpacesService = {
  async list(params: ListParams = {}): Promise<PageResponse<DiningSpace>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
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

  async listLocales(spaceId: number, params: ListParams = {}): Promise<PageResponse<DiningSpaceLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<DiningSpaceLocale>>(`/dining-spaces/${spaceId}/locales?${query}`);
  },

  async addLocale(spaceId: number, body: CreateDiningSpaceLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dining-spaces/${spaceId}/locales`, body);
  },

  async updateLocale(spaceId: number, entryId: number, body: CreateDiningSpaceLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dining-spaces/${spaceId}/locales/${entryId}`, body);
  },

  async removeLocale(spaceId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dining-spaces/${spaceId}/locales/${entryId}`);
  },
};
