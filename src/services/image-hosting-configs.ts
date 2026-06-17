import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export type ImageHostingProvider = string;

export interface ImageHostingConfigKey {
  key: string;
  label: string;
}

export interface ImageHostingProviderInfo {
  provider: string;
  label: string;
  required_keys: ImageHostingConfigKey[];
}

// The API doesn't expose which keys are secret — maintain a local list for the password-toggle UX only
export const SECRET_KEY_NAMES = new Set(["secret_key", "api_secret", "api_key"]);

export interface ImageHostingConfig {
  id: number;
  provider: ImageHostingProvider;
  config: Record<string, string>;
}

export interface CreateImageHostingConfigRequest {
  provider: ImageHostingProvider;
  config: Record<string, string>;
}

export const imageHostingConfigsService = {
  async getProviders(): Promise<ImageHostingProviderInfo[]> {
    return api.get<ImageHostingProviderInfo[]>(`/restaurant-image-hosting-configs/providers`);
  },

  async list(params: ListParams = {}): Promise<PageResponse<ImageHostingConfig>> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<ImageHostingConfig>>(`/restaurant-image-hosting-configs?${query}`);
  },

  async get(id: number): Promise<{ restaurant_image_hosting_config: ImageHostingConfig }> {
    return api.get(`/restaurant-image-hosting-configs/${id}`);
  },

  async create(body: CreateImageHostingConfigRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/restaurant-image-hosting-configs", body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/restaurant-image-hosting-configs/${id}`);
  },
};
