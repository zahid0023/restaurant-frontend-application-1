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
  async list(params: ListParams = {}): Promise<PageResponse<Dish>> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC", query } = params;
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (query) qs.set("query", query);
    return api.get<PageResponse<Dish>>(`/dishes?${qs}`);
  },

  async get(id: number): Promise<{ dish: Dish }> {
    return api.get<{ dish: Dish }>(`/dishes/${id}`);
  },

  async create(body: CreateDishRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/dishes", body);
  },

  async update(id: number, body: UpdateDishRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${id}`);
  },

  async addLocale(dishId: number, body: CreateDishLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/locales`, body);
  },

  async updateLocale(dishId: number, localeId: number, body: UpdateDishLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/locales/${localeId}`, body);
  },

  async removeLocale(dishId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/locales/${localeId}`);
  },
};
