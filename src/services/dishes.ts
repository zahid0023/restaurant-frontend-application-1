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
  locales?: DishLocale[];
}

export interface DishVariantLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface DishVariantIngredient {
  id: number;
  dish_variant_id: number;
  item_id: number;
  quantity: number;
  unit_id: number;
  sort_order: number;
}

export interface DishVariant {
  id: number;
  dish_id: number;
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
  locales?: DishVariantLocale[];
  ingredients?: DishVariantIngredient[];
}

export interface DishDetail extends Dish {
  variants?: DishVariant[];
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

export interface CreateDishVariantLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateDishVariantLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateDishVariantIngredientRequest {
  item_id: number;
  quantity: number;
  unit_id: number;
  sort_order: number;
}

export interface UpdateDishVariantIngredientRequest {
  quantity: number;
  unit_id: number;
  sort_order: number;
}

export interface CreateDishVariantRequest {
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
  locales?: CreateDishVariantLocaleRequest[];
  ingredients?: CreateDishVariantIngredientRequest[];
}

export interface UpdateDishVariantRequest {
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
}

export interface CreateDishRequest {
  code: string;
  sort_order: number;
  locales?: CreateDishLocaleRequest[];
}

export interface UpdateDishRequest {
  sort_order: number;
}

export const dishesService = {
  async list(params: ListParams = {}): Promise<PageResponse<Dish>> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC", query } = params;
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (query) qs.set("query", query);
    return api.get<PageResponse<Dish>>(`/dishes?${qs}`);
  },

  async get(id: number): Promise<{ dish: DishDetail }> {
    return api.get<{ dish: DishDetail }>(`/dishes/${id}`);
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

  // Dish locales
  async addLocale(dishId: number, body: CreateDishLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/locales`, body);
  },

  async updateLocale(dishId: number, localeId: number, body: UpdateDishLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/locales/${localeId}`, body);
  },

  async removeLocale(dishId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/locales/${localeId}`);
  },

  // Variants
  async listVariants(dishId: number, params: ListParams = {}): Promise<PageResponse<DishVariant>> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<DishVariant>>(`/dishes/${dishId}/variants?${qs}`);
  },

  async getVariant(dishId: number, variantId: number): Promise<{ dish_variant: DishVariant }> {
    return api.get<{ dish_variant: DishVariant }>(`/dishes/${dishId}/variants/${variantId}`);
  },

  async addVariant(dishId: number, body: CreateDishVariantRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/variants`, body);
  },

  async updateVariant(dishId: number, variantId: number, body: UpdateDishVariantRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/variants/${variantId}`, body);
  },

  async removeVariant(dishId: number, variantId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/variants/${variantId}`);
  },

  // Variant locales
  async addVariantLocale(dishId: number, variantId: number, body: CreateDishVariantLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/locales`, body);
  },

  async updateVariantLocale(dishId: number, variantId: number, localeId: number, body: UpdateDishVariantLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/locales/${localeId}`, body);
  },

  async removeVariantLocale(dishId: number, variantId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/locales/${localeId}`);
  },

  // Variant ingredients
  async addVariantIngredient(dishId: number, variantId: number, body: CreateDishVariantIngredientRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/ingredients`, body);
  },

  async updateVariantIngredient(dishId: number, variantId: number, ingredientId: number, body: UpdateDishVariantIngredientRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/ingredients/${ingredientId}`, body);
  },

  async removeVariantIngredient(dishId: number, variantId: number, ingredientId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/ingredients/${ingredientId}`);
  },
};
