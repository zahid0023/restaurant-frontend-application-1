import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface ItemType {
  id: number;
  code: string;
  is_consumable: boolean;
  sort_order: number;
}

export interface ItemTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemTypeLocaleRequest {
  locale_id: number;
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
  code: string;
  is_consumable: boolean;
  sort_order: number;
}

export const itemTypesService = {
  async list(params: ListParams = {}): Promise<PageResponse<ItemType>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
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

  async listLocales(typeId: number, params: ListParams = {}): Promise<PageResponse<ItemTypeLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemTypeLocale>>(`/item-types/${typeId}/locales?${query}`);
  },

  async addLocale(typeId: number, body: CreateItemTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/item-types/${typeId}/locales`, body);
  },

  async updateLocale(typeId: number, entryId: number, body: CreateItemTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/item-types/${typeId}/locales/${entryId}`, body);
  },

  async removeLocale(typeId: number, entryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-types/${typeId}/locales/${entryId}`);
  },
};
