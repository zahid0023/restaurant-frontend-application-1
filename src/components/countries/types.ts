export type CountryDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface CountryFormState {
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  locales: LocaleRow[];
}
