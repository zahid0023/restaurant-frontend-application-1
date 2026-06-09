import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";

export interface CategoryItemEntry {
  id: number;
  unit_id: number;
  sort_order: number;
}

export const itemItemCategoriesService = {
  async assign(itemId: number, itemCategoryId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>("/item-item-categories", {
      item_id: itemId,
      item_category_id: itemCategoryId,
    });
  },

  async unassign(itemId: number, itemCategoryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/item-item-categories/${itemId}/${itemCategoryId}`);
  },

  async listItems(itemCategoryId: number, params: ListParams = {}): Promise<PageResponse<CategoryItemEntry>> {
    const { page = 0, size = 20, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<CategoryItemEntry>>(`/item-item-categories/${itemCategoryId}/items?${query}`);
  },
};
