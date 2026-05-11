import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface Item {
  id: number;
  code?: string;
  unit_id: number;
  sort_order: number;
}

export interface ItemLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemRequest {
  code?: string;
  unit_id: number;
  sort_order: number;
  locales?: CreateItemLocaleRequest[];
}

export interface UpdateItemRequest {
  code?: string;
  unit_id: number;
  sort_order: number;
}

export const itemsService = {
  async list(params: ListParams = {}): Promise<PageResponse<Item>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<Item>>(`/items?${query}`);
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

  async listLocales(itemId: number, params: ListParams = {}): Promise<PageResponse<ItemLocale>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemLocale>>(`/items/${itemId}/locales?${query}`);
  },

  async addLocale(itemId: number, body: CreateItemLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/items/${itemId}/locales`, body);
  },

  async updateLocale(itemId: number, localeId: number, body: CreateItemLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/items/${itemId}/locales/${localeId}`, body);
  },

  async removeLocale(itemId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/items/${itemId}/locales/${localeId}`);
  },
};
