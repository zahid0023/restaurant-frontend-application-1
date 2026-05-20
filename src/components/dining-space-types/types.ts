export type DiningSpaceTypeDialogMode = "create" | "view";

export interface DiningSpaceTypeLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface DiningSpaceTypeFormState {
  code: string;
  sort_order: number;
  locales: DiningSpaceTypeLocaleRow[];
}
