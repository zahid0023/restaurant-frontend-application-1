import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface DishLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Dish {
  id: number;
  menu_category_id: number;
  code: string;
  sort_order: number;
  is_veg?: boolean;
  locales?: DishLocale[];
}

export interface CreateDishLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateDishLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDishIngredientRequest {
  item_id: number;
  quantity: number;
  unit_id: number;
}

export interface CreateDishRecipeRequest {
  code: string;
  ingredients: CreateDishIngredientRequest[];
}

export interface CreateDishVariantLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDishVariantRequest {
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_available: boolean;
  is_featured: boolean;
  locales?: CreateDishVariantLocaleRequest[];
  recipe: CreateDishRecipeRequest;
}

export interface CreateDishRequest {
  code: string;
  sort_order: number;
  is_veg?: boolean;
  locales?: CreateDishLocaleRequest[];
  variants?: CreateDishVariantRequest[];
}

export interface UpdateDishRequest {
  sort_order: number;
  is_veg?: boolean;
}

export const dishesService = {
  async list(menuCategoryId: number, params: ListParams = {}): Promise<PageResponse<Dish>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<Dish>>(`/menu-categories/${menuCategoryId}/dishes?${query}`);
  },

  async get(menuCategoryId: number, id: number): Promise<{ dish: Dish }> {
    return api.get<{ dish: Dish }>(`/menu-categories/${menuCategoryId}/dishes/${id}`);
  },

  async create(menuCategoryId: number, body: CreateDishRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/menu-categories/${menuCategoryId}/dishes`, body);
  },

  async update(menuCategoryId: number, id: number, body: UpdateDishRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menu-categories/${menuCategoryId}/dishes/${id}`, body);
  },

  async remove(menuCategoryId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menu-categories/${menuCategoryId}/dishes/${id}`);
  },

  async addLocale(menuId: number, menuCategoryId: number, dishId: number, body: CreateDishLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/menus/${menuId}/menu-categories/${menuCategoryId}/dishes/${dishId}/locales`, body);
  },

  async updateLocale(menuId: number, menuCategoryId: number, dishId: number, localeId: number, body: UpdateDishLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/menus/${menuId}/menu-categories/${menuCategoryId}/dishes/${dishId}/locales/${localeId}`, body);
  },

  async removeLocale(menuId: number, menuCategoryId: number, dishId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menus/${menuId}/menu-categories/${menuCategoryId}/dishes/${dishId}/locales/${localeId}`);
  },
};
