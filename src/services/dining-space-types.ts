import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface DiningSpaceType {
  id: number;
  code: string;
  sort_order: number;
}

export interface DiningSpaceTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDiningSpaceTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDiningSpaceTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreateDiningSpaceTypeLocaleRequest[];
}

export interface UpdateDiningSpaceTypeRequest {
  code: string;
  sort_order: number;
}

export const diningSpaceTypesService = {
  async list(params: ListParams = {}): Promise<PageResponse<DiningSpaceType>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<DiningSpaceType>>(`/dining-space-types?${query}`);
  },

  async get(id: number): Promise<{ dining_space_type: DiningSpaceType }> {
    return api.get<{ dining_space_type: DiningSpaceType }>(`/dining-space-types/${id}`);
  },

  async create(body: CreateDiningSpaceTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/dining-space-types", body);
  },

  async update(id: number, body: UpdateDiningSpaceTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dining-space-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dining-space-types/${id}`);
  },

  async listLocales(typeId: number, params: ListParams = {}): Promise<PageResponse<DiningSpaceTypeLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<DiningSpaceTypeLocale>>(`/dining-space-types/${typeId}/locales?${query}`);
  },

  async addLocale(typeId: number, body: CreateDiningSpaceTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dining-space-types/${typeId}/locales`, body);
  },

  async updateLocale(typeId: number, entryId: number, body: CreateDiningSpaceTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dining-space-types/${typeId}/locales/${entryId}`, body);
  },

  async removeLocale(typeId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dining-space-types/${typeId}/locales/${entryId}`);
  },
};
