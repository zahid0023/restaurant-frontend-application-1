import { api } from "./api";
import type { MutationResponse } from "./common";

export interface RestaurantImage {
  id: number;
  config_id?: number;
  external_id: string;
  url: string;
  caption?: string;
  sort_order: number;
  is_default?: boolean;
}

export interface UploadImageMeta {
  client_image_id: string;
  caption?: string;
  is_default?: boolean;
  sort_order?: number;
}

export interface ImagePageResponse {
  content: RestaurantImage[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface UpdateRestaurantImageRequest {
  caption?: string;
  sort_order: number;
}

export const restaurantImagesService = {
  async list(page = 0, size = 20, sort_by = "sortOrder", sort_dir = "asc"): Promise<ImagePageResponse> {
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<ImagePageResponse>(`/restaurant-images?${query}`);
  },

  async get(id: number): Promise<{ restaurant_image: RestaurantImage }> {
    return api.get(`/restaurant-images/${id}`);
  },

  async upload(configId: number, files: File[], metas: UploadImageMeta[]): Promise<RestaurantImage[]> {
    const form = new FormData();
    for (const file of files) {
      form.append("images", file, file.name);
    }
    form.append("meta", new Blob([JSON.stringify(metas)], { type: "application/json" }));
    return api.postForm<RestaurantImage[]>(`/restaurant-images?config_id=${configId}`, form);
  },

  async update(id: number, body: UpdateRestaurantImageRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/restaurant-images/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/restaurant-images/${id}`);
  },
};
