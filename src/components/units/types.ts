export type UnitDialogMode = "create" | "edit" | "view";

export interface UnitLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface UnitFormState {
  code: string;
  is_base: boolean;
  sort_order: number;
  locales: UnitLocaleRow[];
}
