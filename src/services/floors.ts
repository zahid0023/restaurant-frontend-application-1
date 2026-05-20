import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface FloorLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Floor {
  id: number;
  code: string;
  sort_order: number;
  locales: FloorLocale[];
}

export interface CreateFloorLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateFloorLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateFloorRequest {
  code: string;
  sort_order: number;
  locales?: CreateFloorLocaleRequest[];
}

export interface UpdateFloorRequest {
  sort_order: number;
}

export const floorsService = {
  async list(params: ListParams = {}): Promise<PageResponse<Floor>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<Floor>>(`/floors?${query}`);
  },

  async get(id: number): Promise<{ floor: Floor }> {
    return api.get<{ floor: Floor }>(`/floors/${id}`);
  },

  async create(body: CreateFloorRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/floors", body);
  },

  async update(id: number, body: UpdateFloorRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/floors/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/floors/${id}`);
  },

  async addLocale(floorId: number, body: CreateFloorLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/floors/${floorId}/locales`, body);
  },

  async updateLocale(floorId: number, localeId: number, body: UpdateFloorLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/floors/${floorId}/locales/${localeId}`, body);
  },

  async removeLocale(floorId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/floors/${floorId}/locales/${localeId}`);
  },
};
