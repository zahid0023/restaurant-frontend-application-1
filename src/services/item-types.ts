import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface ItemTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ItemInTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ItemInTypeUnitType {
  id: number;
  code: string;
  sort_order: number;
  locales: ItemInTypeLocale[];
}

export interface ItemInType {
  id: number;
  code: string;
  unit_type: ItemInTypeUnitType;
  sort_order: number;
  locales: ItemInTypeLocale[];
}

export interface ItemType {
  id: number;
  code: string;
  is_consumable: boolean;
  sort_order: number;
  locales: ItemTypeLocale[];
  items?: ItemInType[];
}

export interface CreateItemTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateItemTypeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemTypeRequest {
  code: string;
  is_consumable: boolean;
  sort_order: number;
  locales?: CreateItemTypeLocaleRequest[];
}

export interface UpdateItemTypeRequest {
  is_consumable: boolean;
  sort_order: number;
}

export const itemTypesService = {
  async list(params: ListParams = {}): Promise<PageResponse<ItemType>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemType>>(`/item-types?${query}`);
  },

  async get(id: number): Promise<{ item_type: ItemType }> {
    return api.get<{ item_type: ItemType }>(`/item-types/${id}`);
  },

  async create(body: CreateItemTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/item-types", body);
  },

  async update(id: number, body: UpdateItemTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/item-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-types/${id}`);
  },

  async addLocale(typeId: number, body: CreateItemTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/item-types/${typeId}/locales`, body);
  },

  async updateLocale(typeId: number, localeId: number, body: UpdateItemTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/item-types/${typeId}/locales/${localeId}`, body);
  },

  async removeLocale(typeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-types/${typeId}/locales/${localeId}`);
  },
};
