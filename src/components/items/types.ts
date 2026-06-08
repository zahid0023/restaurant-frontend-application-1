export type ItemDialogMode = "create" | "edit" | "view";

export interface ItemLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface ItemFormState {
  code: string;
  item_type_id: number | "";
  unit_type_id: number | "";
  sort_order: number;
  locales: ItemLocaleRow[];
}
