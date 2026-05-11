import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface UnitType {
  id: number;
  code: string;
  sort_order: number;
}

export interface UnitTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateUnitTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateUnitTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreateUnitTypeLocaleRequest[];
}

export interface UpdateUnitTypeRequest {
  code: string;
  sort_order: number;
}

export const unitTypesService = {
  async list(params: ListParams = {}): Promise<PageResponse<UnitType>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<UnitType>>(`/unit-types?${query}`);
  },

  async get(id: number): Promise<{ unit_type: UnitType }> {
    return api.get<{ unit_type: UnitType }>(`/unit-types/${id}`);
  },

  async create(body: CreateUnitTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/unit-types", body);
  },

  async update(id: number, body: UpdateUnitTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${id}`);
  },

  async listLocales(typeId: number, params: ListParams = {}): Promise<PageResponse<UnitTypeLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<UnitTypeLocale>>(`/unit-types/${typeId}/locales?${query}`);
  },

  async addLocale(typeId: number, body: CreateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/unit-types/${typeId}/locales`, body);
  },

  async updateLocale(typeId: number, entryId: number, body: CreateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${typeId}/locales/${entryId}`, body);
  },

  async removeLocale(typeId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${typeId}/locales/${entryId}`);
  },
};
