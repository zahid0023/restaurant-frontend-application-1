export type DiningSpaceDialogMode = "create" | "edit" | "view";

export interface DiningSpaceLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface DiningSpaceFormState {
  dining_space_type_id: number | "";
  floor_id: number | null;
  code: string;
  sort_order: number;
  capacity: number;
  is_bookable: boolean;
  locales: DiningSpaceLocaleRow[];
}
