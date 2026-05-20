import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface ItemLocaleSummary {
  id: number;
  locale_code: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ItemLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ItemUnitSummary {
  id: number;
  code: string;
  is_base: boolean;
  sort_order: number;
  unit_type: { id: number; code: string; sort_order: number };
}

export interface ItemSummary {
  id: number;
  code: string;
  unit: ItemUnitSummary;
  sort_order: number;
  locales: ItemLocaleSummary[];
}

export interface Item {
  id: number;
  code: string;
  unit_id: number;
  sort_order: number;
  locales: ItemLocale[];
}

export interface CreateItemLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateItemLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemRequest {
  code: string;
  unit_id: number;
  sort_order: number;
  locales?: CreateItemLocaleRequest[];
}

export interface UpdateItemRequest {
  unit_id: number;
  sort_order: number;
}

export const itemsService = {
  async list(params: ListParams = {}): Promise<PageResponse<ItemSummary>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemSummary>>(`/items?${query}`);
  },

  async get(id: number): Promise<{ item: Item }> {
    return api.get<{ item: Item }>(`/items/${id}`);
  },

  async create(body: CreateItemRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/items", body);
  },

  async update(id: number, body: UpdateItemRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/items/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/items/${id}`);
  },

  async addLocale(itemId: number, body: CreateItemLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/items/${itemId}/locales`, body);
  },

  async updateLocale(itemId: number, localeId: number, body: UpdateItemLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/items/${itemId}/locales/${localeId}`, body);
  },

  async removeLocale(itemId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/items/${itemId}/locales/${localeId}`);
  },
};
