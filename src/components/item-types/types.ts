export type ItemTypeDialogMode = "create" | "edit" | "view";

export interface ItemTypeLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface ItemTypeFormState {
  code: string;
  is_consumable: boolean;
  sort_order: number;
  locales: ItemTypeLocaleRow[];
}
