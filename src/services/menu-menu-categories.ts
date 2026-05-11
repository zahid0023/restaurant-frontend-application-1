import { api } from "./api";
import type { MutationResponse, PageResponse, ListParams } from "./common";
import type { MenuCategoryLocale } from "./menu-categories";

export interface AssignedMenuCategory {
  id: number;
  code: string;
  sort_order: number;
  locales?: MenuCategoryLocale[];
}

export const menuMenuCategoriesService = {
  async assign(menuId: number, menuCategoryId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>("/menu-menu-categories", {
      menu_id: menuId,
      menu_category_id: menuCategoryId,
    });
  },

  async listForMenu(menuId: number, params: ListParams = {}): Promise<PageResponse<AssignedMenuCategory>> {
    const { page = 0, size = 50, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    return api.get<PageResponse<AssignedMenuCategory>>(
      `/menu-menu-categories/${menuId}/menu-categories?${query}`,
    );
  },

  async unassign(menuId: number, menuCategoryId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/menu-menu-categories/${menuId}/${menuCategoryId}`);
  },
};
