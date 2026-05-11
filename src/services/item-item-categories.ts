import { api } from "./api";
import type { MutationResponse } from "./common";

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
};
