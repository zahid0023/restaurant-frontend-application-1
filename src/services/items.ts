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

export interface UnitTypeSummary {
  id: number;
  code: string;
  sort_order: number;
  locales: { id: number; locale_id: number; name: string; sort_order: number }[];
}

export interface ItemSummary {
  id: number;
  code: string;
  sort_order: number;
  locales: ItemLocaleSummary[];
  unit_type?: UnitTypeSummary;
}

export interface Item {
  id: number;
  code: string;
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
  item_type_id: number;
  unit_type_id: number;
  code: string;
  sort_order: number;
  locales?: CreateItemLocaleRequest[];
}

export interface UpdateItemRequest {
  sort_order: number;
}

export const itemsService = {
  async list(params: ListParams = {}): Promise<PageResponse<ItemSummary>> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC", query } = params;
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (query) qs.set("query", query);
    return api.get<PageResponse<ItemSummary>>(`/items?${qs}`);
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
