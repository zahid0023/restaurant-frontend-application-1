import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface ItemCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ItemCategory {
  id: number;
  parent_id?: number | null;
  code: string;
  sort_order: number;
  locales: ItemCategoryLocale[];
}

export interface CreateItemCategoryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateItemCategoryLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateItemCategoryRequest {
  parent_id?: number | null;
  code: string;
  sort_order: number;
  locales?: CreateItemCategoryLocaleRequest[];
}

export interface UpdateItemCategoryRequest {
  sort_order: number;
}

export interface ItemCategoryLocaleInDetail {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface SubCategoryInDetail {
  id: number;
  code: string;
  sort_order: number;
  locales: ItemCategoryLocaleInDetail[];
}

export interface ItemLocaleInDetail {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UnitTypeInDetail {
  id: number;
  code: string;
  sort_order: number;
  locales: { id: number; locale_id: number; name: string; sort_order: number }[];
}

export interface ItemInDetail {
  id: number;
  code: string;
  unit_type: UnitTypeInDetail;
  sort_order: number;
  locales: ItemLocaleInDetail[];
}

export interface ItemCategoryDetail extends ItemCategory {
  locales: ItemCategoryLocaleInDetail[];
  sub_categories: SubCategoryInDetail[];
  items: ItemInDetail[];
}

// Shop-level item categories
export interface ShopItemCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ShopItemCategory {
  id: number;
  parent_id: number | null;
  code: string;
  sort_order: number;
  shop_item_category_locales?: ShopItemCategoryLocale[];
}

export const itemCategoriesService = {
  async list(params: ListParams = {}): Promise<PageResponse<ItemCategory>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemCategory>>(`/item-categories?${query}`);
  },

  async listRoot(params: ListParams = {}): Promise<PageResponse<ItemCategory>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemCategory>>(`/item-categories/root?${query}`);
  },

  async listSubcategories(categoryId: number, params: ListParams = {}): Promise<PageResponse<ItemCategory>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ItemCategory>>(`/item-categories/${categoryId}/sub-categories?${query}`);
  },

  async get(id: number): Promise<{ item_category: ItemCategoryDetail }> {
    return api.get<{ item_category: ItemCategoryDetail }>(`/item-categories/${id}`);
  },

  async create(body: CreateItemCategoryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/item-categories", body);
  },

  async update(id: number, body: UpdateItemCategoryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/item-categories/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-categories/${id}`);
  },

  async addLocale(categoryId: number, body: CreateItemCategoryLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/item-categories/${categoryId}/locales`, body);
  },

  async updateLocale(categoryId: number, localeId: number, body: UpdateItemCategoryLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/item-categories/${categoryId}/locales/${localeId}`, body);
  },

  async removeLocale(categoryId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-categories/${categoryId}/locales/${localeId}`);
  },
};
