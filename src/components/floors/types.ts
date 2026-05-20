export type FloorDialogMode = "create" | "view";

export interface FloorLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface FloorFormState {
  code: string;
  sort_order: number;
  locales: FloorLocaleRow[];
}
