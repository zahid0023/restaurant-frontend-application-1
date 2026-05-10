export type CityDialogMode = "create" | "edit" | "view";

export interface CityLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface CityFormState {
  country_id: number | "";
  code: string;
  sort_order: number;
  locales: CityLocaleRow[];
}
