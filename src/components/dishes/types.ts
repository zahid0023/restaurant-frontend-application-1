export type DishDialogMode = "create" | "view";

export interface DishLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface DishFormState {
  code: string;
  sort_order: number;
  locales: DishLocaleRow[];
}
