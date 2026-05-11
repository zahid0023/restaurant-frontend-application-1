export type MenuCategoryDialogMode = "create" | "edit" | "view";

export interface MenuCategoryLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface MenuCategoryFormState {
  code: string;
  sort_order: number;
  locales: MenuCategoryLocaleRow[];
}
