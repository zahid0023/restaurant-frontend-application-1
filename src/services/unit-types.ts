import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface UnitTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// Full type returned by GET /unit-types/{id}
export interface UnitType {
  id: number;
  code: string;
  sort_order: number;
  locales: UnitTypeLocale[];
}

// Summary type returned by GET /unit-types (list) — no locales
export interface UnitTypeSummary {
  id: number;
  code: string;
  sort_order: number;
}

export interface CreateUnitTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateUnitTypeLocaleRequest {
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
  sort_order: number;
}

export const unitTypesService = {
  async list(params: ListParams = {}): Promise<PageResponse<UnitTypeSummary>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<UnitTypeSummary>>(`/unit-types?${query}`);
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

  async addLocale(unitTypeId: number, body: CreateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/unit-types/${unitTypeId}/locales`, body);
  },

  async updateLocale(unitTypeId: number, localeId: number, body: UpdateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${unitTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(unitTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${unitTypeId}/locales/${localeId}`);
  },
};
