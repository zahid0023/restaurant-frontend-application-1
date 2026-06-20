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
  is_featured: boolean;
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

export interface DishVariantIngredientDetail {
  id: number;
  item: {
    id: number;
    code: string;
    sort_order: number;
    locales: { id: number; locale_id: number; name: string; sort_order: number }[];
  };
  quantity: number;
  unit: {
    id: number;
    code: string;
    is_base: boolean;
    sort_order: number;
    unit_type: { id: number; code: string; sort_order: number };
    locales: { id: number; locale_id: number; name: string; sort_order: number }[];
  };
  sort_order: number;
}

export interface DishVariantDetail {
  id: number;
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_veg: boolean;
  locales?: DishVariantLocale[];
  ingredients?: DishVariantIngredientDetail[];
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

export interface DishVariantImage {
  id: number;
  config_id?: number;
  dish_variant_id?: number;
  external_id: string;
  url: string;
  caption?: string;
  sort_order: number;
}

export interface VariantImageMeta {
  client_image_id: string;
  caption?: string;
  sort_order?: number;
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

export interface SetDishFeaturedRequest {
  is_featured: boolean;
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

  async setFeatured(id: number, is_featured: boolean): Promise<MutationResponse> {
    return api.patch<MutationResponse>(`/dishes/${id}/featured`, { is_featured });
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

  async getVariant(dishId: number, variantId: number): Promise<{ dish_variant: DishVariantDetail }> {
    return api.get<{ dish_variant: DishVariantDetail }>(`/dishes/${dishId}/variants/${variantId}`);
  },

  async addVariant(dishId: number, body: CreateDishVariantRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/dishes/${dishId}/variants`, body);
  },

  async addVariantWithImages(
    dishId: number,
    data: CreateDishVariantRequest,
    configId: number,
    images: File[],
    imageMetas: VariantImageMeta[],
  ): Promise<MutationResponse> {
    const form = new FormData();
    form.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    for (const file of images) {
      form.append("images", file, file.name);
    }
    form.append("image-metas", new Blob([JSON.stringify(imageMetas)], { type: "application/json" }));
    return api.postForm<MutationResponse>(`/dishes/${dishId}/variants?config-id=${configId}`, form);
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

  // Variant images
  async uploadVariantImages(
    dishId: number,
    variantId: number,
    configId: number,
    images: File[],
    metas: VariantImageMeta[],
  ): Promise<DishVariantImage[]> {
    const form = new FormData();
    for (const file of images) {
      form.append("images", file, file.name);
    }
    form.append("meta", new Blob([JSON.stringify(metas)], { type: "application/json" }));
    return api.postForm<DishVariantImage[]>(`/dishes/${dishId}/variants/${variantId}/images?config_id=${configId}`, form);
  },

  async listVariantImages(dishId: number, variantId: number): Promise<PageResponse<DishVariantImage>> {
    return api.get<PageResponse<DishVariantImage>>(`/dishes/${dishId}/variants/${variantId}/images`);
  },

  async updateVariantImage(
    dishId: number,
    variantId: number,
    imageId: number,
    body: { caption?: string; sort_order: number },
  ): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/images/${imageId}`, body);
  },

  async deleteVariantImage(dishId: number, variantId: number, imageId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/dishes/${dishId}/variants/${variantId}/images/${imageId}`);
  },
};
