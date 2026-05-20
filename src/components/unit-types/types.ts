export type UnitTypeDialogMode = "create" | "edit" | "view";

export interface UnitTypeLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface UnitTypeFormState {
  code: string;
  sort_order: number;
  locales: UnitTypeLocaleRow[];
}
