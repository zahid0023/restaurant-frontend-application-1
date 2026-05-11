import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface Unit {
  id: number;
  unit_type_id: number;
  code: string;
  is_base: boolean;
  sort_order: number;
}

export interface UnitLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateUnitLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateUnitRequest {
  unit_type_id: number;
  code: string;
  is_base: boolean;
  sort_order: number;
  locales?: CreateUnitLocaleRequest[];
}

export interface UpdateUnitRequest {
  unit_type_id: number;
  code: string;
  is_base: boolean;
  sort_order: number;
}

export const unitsService = {
  async list(unitTypeId: number, params: ListParams = {}): Promise<PageResponse<Unit>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<Unit>>(`/unit-types/${unitTypeId}/units?${query}`);
  },

  async get(unitTypeId: number, id: number): Promise<{ unit: Unit }> {
    return api.get<{ unit: Unit }>(`/unit-types/${unitTypeId}/units/${id}`);
  },

  async create(unitTypeId: number, body: CreateUnitRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/unit-types/${unitTypeId}/units`, body);
  },

  async update(unitTypeId: number, id: number, body: UpdateUnitRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${unitTypeId}/units/${id}`, body);
  },

  async remove(unitTypeId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${unitTypeId}/units/${id}`);
  },

  async listLocales(unitTypeId: number, unitId: number, params: ListParams = {}): Promise<PageResponse<UnitLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<UnitLocale>>(`/unit-types/${unitTypeId}/units/${unitId}/locales?${query}`);
  },

  async addLocale(unitTypeId: number, unitId: number, body: CreateUnitLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/unit-types/${unitTypeId}/units/${unitId}/locales`, body);
  },

  async updateLocale(unitTypeId: number, unitId: number, entryId: number, body: CreateUnitLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${unitTypeId}/units/${unitId}/locales/${entryId}`, body);
  },

  async removeLocale(unitTypeId: number, unitId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${unitTypeId}/units/${unitId}/locales/${entryId}`);
  },
};
