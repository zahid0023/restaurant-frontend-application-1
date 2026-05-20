import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface MenuLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface MenuCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface MenuCategory {
  id: number;
  code: string;
  sort_order: number;
  locales?: MenuCategoryLocale[];
}

export interface Menu {
  id: number;
  code: string;
  sort_order: number;
  locales?: MenuLocale[];
  menu_categories?: MenuCategory[];
}

export interface CreateMenuLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateMenuRequest {
  code: string;
  sort_order: number;
  locales?: CreateMenuLocaleRequest[];
}

export interface UpdateMenuRequest {
  sort_order: number;
}

export interface UpdateMenuLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export const menusService = {
  async list(params: ListParams = {}): Promise<PageResponse<Menu>> {
    const { page = 0, size = 10, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<Menu>>(`/menus?${query}`);
  },

  async get(id: number): Promise<{ menu: Menu }> {
    return api.get<{ menu: Menu }>(`/menus/${id}`);
  },

  async create(body: CreateMenuRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/menus", body);
  },

  async update(id: number, body: UpdateMenuRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menus/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menus/${id}`);
  },

  async listLocales(menuId: number, params: ListParams = {}): Promise<PageResponse<MenuLocale>> {
    const { page = 0, size = 10, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<MenuLocale>>(`/menus/${menuId}/locales?${query}`);
  },

  async addLocale(menuId: number, body: CreateMenuLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/menus/${menuId}/locales`, body);
  },

  async updateLocale(menuId: number, localeId: number, body: UpdateMenuLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menus/${menuId}/locales/${localeId}`, body);
  },

  async removeLocale(menuId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menus/${menuId}/locales/${localeId}`);
  },
};
