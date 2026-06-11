import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface MenuCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface MenuCategoryDish {
  id: number;
  code: string;
  sort_order: number;
  locales?: { id: number; locale_id: number; name: string; description?: string; sort_order: number }[];
}

export interface MenuCategory {
  id: number;
  code: string;
  sort_order: number;
  locales?: MenuCategoryLocale[];
  dishes?: MenuCategoryDish[];
}

export interface CreateMenuCategoryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateMenuCategoryLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateMenuCategoryRequest {
  menu_type_id: number;
  code: string;
  sort_order: number;
  locales?: CreateMenuCategoryLocaleRequest[];
}

export interface UpdateMenuCategoryRequest {
  sort_order: number;
}

export const menuCategoriesService = {
  async listAll(params: ListParams = {}): Promise<PageResponse<MenuCategory>> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<MenuCategory>>(`/menu-categories?${qs}`);
  },

  async list(menuTypeId: number, params: ListParams = {}): Promise<PageResponse<MenuCategory>> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<MenuCategory>>(`/menu-categories/by/${menuTypeId}?${query}`);
  },

  async get(id: number): Promise<{ menu_category: MenuCategory }> {
    return api.get<{ menu_category: MenuCategory }>(`/menu-categories/${id}`);
  },

  async create(body: CreateMenuCategoryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/menu-categories", body);
  },

  async update(id: number, body: UpdateMenuCategoryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menu-categories/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menu-categories/${id}`);
  },

  async addLocale(categoryId: number, body: CreateMenuCategoryLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/menu-categories/${categoryId}/locales`, body);
  },

  async updateLocale(categoryId: number, localeId: number, body: UpdateMenuCategoryLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menu-categories/${categoryId}/locales/${localeId}`, body);
  },

  async removeLocale(categoryId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menu-categories/${categoryId}/locales/${localeId}`);
  },

  async assignDish(categoryId: number, dishId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/menu-categories/${categoryId}/dishes/assign`, { dish_id: dishId });
  },

  async unassignDish(categoryId: number, dishId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menu-categories/${categoryId}/dishes/${dishId}/unassign`);
  },
};
