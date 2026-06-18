"use client";

import { useEffect, useRef, useState } from "react";
import { dishesService } from "@/services/dishes";
import type { DishVariantIngredient, DishVariantIngredientDetail } from "@/services/dishes";
import { itemsService, type ItemSummary } from "@/services/items";
import type { Unit } from "@/services/units";
import { IngredientsTable, type IngredientRow } from "./ingredients-table";

export interface DishVariantIngredientsProps {
  unitsByTypeId: Record<number, Unit[]>;
  onUnitTypeLoad?: (unitTypeId: number, units: Unit[]) => void;
  mode: "create" | "view";
  // create mode
  rows?: IngredientRow[];
  onRowsChange?: (rows: IngredientRow[]) => void;
  // view mode — full detail objects already fetched by the parent page
  dishId?: number;
  variantId?: number;
  ingredientDetails?: DishVariantIngredientDetail[];
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
  ingredientDetails = [],
  onSaved,
}: DishVariantIngredientsProps) {
  const [availableItems, setAvailableItems] = useState<ItemSummary[]>([]);
  const loadedRef = useRef(false);

  // Derive flat rows from the embedded detail objects the parent already fetched
  const savedRows: DishVariantIngredient[] = ingredientDetails.map((ing) => ({
    id: ing.id,
    dish_variant_id: variantId ?? 0,
    item_id: ing.item.id,
    quantity: ing.quantity,
    unit_id: ing.unit.id,
    sort_order: ing.sort_order,
  }));

  // Seed availableItems and unitsByTypeId from embedded data so names display immediately
  useEffect(() => {
    if (!ingredientDetails.length) return;

    if (!loadedRef.current) {
      setAvailableItems(
        ingredientDetails.map((ing) => ({
          id: ing.item.id,
          code: ing.item.code,
          sort_order: ing.item.sort_order,
          locales: ing.item.locales,
        }))
      );
    }

    const byType: Record<number, Unit[]> = {};
    for (const ing of ingredientDetails) {
      const u = ing.unit;
      const utId = u.unit_type.id;
      if (!byType[utId]) byType[utId] = [];
      if (!byType[utId].some((x) => x.id === u.id)) {
        byType[utId].push({
          id: u.id,
          code: u.code,
          is_base: u.is_base,
          sort_order: u.sort_order,
          unit_type_id: utId,
          locales: u.locales,
        });
      }
    }
    for (const [utId, units] of Object.entries(byType)) {
      onUnitTypeLoad?.(Number(utId), units);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientDetails]);

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
