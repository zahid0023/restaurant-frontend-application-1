export type MenuTypeDialogMode = "create" | "edit" | "view";

export interface MenuTypeLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface MenuTypeFormState {
  code: string;
  sort_order: number;
  locales: MenuTypeLocaleRow[];
}
