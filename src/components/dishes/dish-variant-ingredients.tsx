"use client";

import { useRef, useState } from "react";
import { dishesService } from "@/services/dishes";
import type { DishVariantIngredient } from "@/services/dishes";
import { itemsService, type ItemSummary } from "@/services/items";
import type { Unit } from "@/services/units";
import { IngredientsTable, type IngredientRow } from "./ingredients-table";

export interface DishVariantIngredientsProps {
  unitsByTypeId: Record<number, Unit[]>;
  onUnitTypeLoad?: (unitTypeId: number, units: Unit[]) => void;
  // create mode
  mode: "create" | "view";
  rows?: IngredientRow[];
  onRowsChange?: (rows: IngredientRow[]) => void;
  // view mode
  dishId?: number;
  variantId?: number;
  savedRows?: DishVariantIngredient[];
  onSaved?: () => void | Promise<void>;
}

export function DishVariantIngredients({
  mode,
  unitsByTypeId,
  onUnitTypeLoad,
  rows = [],
  onRowsChange,
  dishId,
  variantId,
  savedRows = [],
  onSaved,
}: DishVariantIngredientsProps) {
  const [availableItems, setAvailableItems] = useState<ItemSummary[]>([]);
  const loadedRef = useRef(false);

  async function loadItems() {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const items = await itemsService.listAll();
      setAvailableItems(items);
    } catch { /* no-op */ }
  }

  async function loadUnitsIfNeeded(itemIdStr: string) {
    const item = availableItems.find((it) => it.id === Number(itemIdStr));
    const utId = item?.unit_type?.id;
    if (utId && !unitsByTypeId[utId]) {
      try {
        const { unitsService } = await import("@/services/units");
        const res = await unitsService.list(utId, { size: 50 });
        onUnitTypeLoad?.(utId, res.data);
      } catch { /* no-op */ }
    }
  }

  if (mode === "create") {
    return (
      <IngredientsTable
        mode="create"
        rows={rows}
        availableItems={availableItems}
        unitsByTypeId={unitsByTypeId}
        onUnitTypeLoad={onUnitTypeLoad}
        onItemSelectOpen={loadItems}
        onAddRow={() =>
          onRowsChange?.([...rows, { item_id: "", quantity: 1, unit_id: "", sort_order: rows.length + 1 }])
        }
        onRemoveRow={(idx) => onRowsChange?.(rows.filter((_, i) => i !== idx))}
        onPatchRow={(idx, patch) =>
          onRowsChange?.(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
        }
        onItemChange={(idx, itemIdStr) => {
          onRowsChange?.(rows.map((r, i) => (i === idx ? { ...r, item_id: Number(itemIdStr), unit_id: "" } : r)));
          loadUnitsIfNeeded(itemIdStr);
        }}
      />
    );
  }

  return (
    <IngredientsTable
      mode="view"
      savedRows={savedRows}
      availableItems={availableItems}
      unitsByTypeId={unitsByTypeId}
      onUnitTypeLoad={onUnitTypeLoad}
      onItemSelectOpen={loadItems}
      onSaveNew={async (row) => {
        if (dishId == null || variantId == null) return;
        await dishesService.addVariantIngredient(dishId, variantId, {
          item_id: Number(row.item_id),
          quantity: Number(row.quantity),
          unit_id: Number(row.unit_id),
          sort_order: Number(row.sort_order) || 1,
        });
        await onSaved?.();
      }}
      onDelete={async (id) => {
        if (dishId == null || variantId == null) return;
        await dishesService.removeVariantIngredient(dishId, variantId, id);
        await onSaved?.();
      }}
    />
  );
}
