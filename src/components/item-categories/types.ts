export type ItemCategoryDialogMode = "create" | "edit" | "view";

export interface ItemCategoryLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface ItemCategoryFormState {
  parent_id: number | null;
  code: string;
  sort_order: number;
  locales: ItemCategoryLocaleRow[];
}
