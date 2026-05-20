export type DishDialogMode = "create" | "view";

export interface DishLocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface IngredientRow {
  item_id: number | "";
  quantity: number;
  unit_id: number | "";
}

export interface DishRecipeRow {
  code: string;
  ingredients: IngredientRow[];
}

export interface DishVariantRow {
  code: string;
  sort_order: number;
  price: number;
  is_default: boolean;
  is_available: boolean;
  is_featured: boolean;
  locales: DishLocaleRow[];
  recipe: DishRecipeRow;
}

export interface DishFormState {
  code: string;
  sort_order: number;
  is_veg: boolean;
  locales: DishLocaleRow[];
  variants: DishVariantRow[];
}
