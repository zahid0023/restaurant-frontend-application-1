"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { DishVariantIngredient } from "@/services/dishes";
import type { ItemSummary } from "@/services/items";
import type { Unit } from "@/services/units";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngredientRow {
  item_id: number | "";
  quantity: number;
  unit_id: number | "";
  sort_order: number;
}

interface BaseProps {
  availableItems: ItemSummary[];
  unitsByTypeId: Record<number, Unit[]>;
  onUnitTypeLoad?: (unitTypeId: number, units: Unit[]) => void;
  onItemSelectOpen?: () => void;
}

interface CreateModeProps extends BaseProps {
  mode: "create";
  rows: IngredientRow[];
  onAddRow: () => void;
  onRemoveRow: (idx: number) => void;
  onPatchRow: (idx: number, patch: Partial<IngredientRow>) => void;
  onItemChange: (idx: number, itemId: string) => void;
}

interface ViewModeProps extends BaseProps {
  mode: "view";
  savedRows: DishVariantIngredient[];
  onSaveNew: (row: IngredientRow) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

type IngredientsTableProps = CreateModeProps | ViewModeProps;

// ─── Component ────────────────────────────────────────────────────────────────

export function IngredientsTable(props: IngredientsTableProps) {
  const { t } = useTranslation();
  const { availableItems, unitsByTypeId, onUnitTypeLoad, onItemSelectOpen } = props;

  // View-mode internal state
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<IngredientRow>({ item_id: "", quantity: 1, unit_id: "", sort_order: 1 });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isCreate = props.mode === "create";

  function getUnits(itemId: number | ""): Unit[] {
    if (!itemId) return [];
    const item = availableItems.find((it) => it.id === itemId);
    const utId = item?.unit_type?.id;
    return utId ? (unitsByTypeId[utId] ?? []) : [];
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

  async function handleSaveNew() {
    if (!newRow.item_id) { toast.error(t("dish.errIngredientItem", { n: 1, m: 1 })); return; }
    if (!newRow.unit_id) { toast.error(t("dish.errIngredientUnit", { n: 1, m: 1 })); return; }
    if (!newRow.quantity || newRow.quantity <= 0) { toast.error(t("dish.errIngredientQty", { n: 1, m: 1 })); return; }
    if (props.mode !== "view") return;
    setSaving(true);
    try {
      await props.onSaveNew(newRow);
      setNewRow({ item_id: "", quantity: 1, unit_id: "", sort_order: 1 });
      setAdding(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (props.mode !== "view") return;
    setDeletingId(id);
    try {
      await props.onDelete(id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleNewItemChange(v: string) {
    setNewRow((prev) => ({ ...prev, item_id: Number(v), unit_id: "" }));
    loadUnitsIfNeeded(v);
  }

  function handleCreateItemChange(idx: number, v: string) {
    if (props.mode !== "create") return;
    props.onItemChange(idx, v);
    loadUnitsIfNeeded(v);
  }

  const savedRows = props.mode === "view" ? props.savedRows : [];
  const formRows = props.mode === "create" ? props.rows : [];
  const isEmpty = isCreate ? formRows.length === 0 : savedRows.length === 0 && !adding;

  function getItemName(itemId: number | ""): string {
    if (!itemId) return "";
    const item = availableItems.find((it) => it.id === itemId);
    return item?.locales[0]?.name ?? item?.code ?? String(itemId);
  }

  function getUnitName(itemId: number | "", unitId: number | ""): string {
    if (!unitId) return "";
    const units = getUnits(itemId);
    const unit = units.find((u) => u.id === unitId);
    return unit?.locales[0]?.name ?? unit?.code ?? String(unitId);
  }

  function getUnitNameById(unitId: number): string {
    for (const units of Object.values(unitsByTypeId)) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) return unit.locales[0]?.name ?? unit.code;
    }
    return String(unitId);
  }

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
        <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {t("dish.ingredients")}
        </span>
        {(!adding || isCreate) && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5"
            onClick={isCreate ? (props as CreateModeProps).onAddRow : () => setAdding(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("dish.addIngredient")}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <UtensilsCrossed className="h-8 w-8 opacity-30" />
          <span className="text-xs">{t("dish.noIngredients", "No ingredients added")}</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dish.item", "Item")}</TableHead>
              <TableHead className="w-24">{t("dish.qty", "Qty")}</TableHead>
              <TableHead className="w-36">{t("dish.unit", "Unit")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCreate
              ? formRows.map((row, idx) => {
                  const units = getUnits(row.item_id);
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select
                          value={row.item_id ? String(row.item_id) : ""}
                          onValueChange={(v) => handleCreateItemChange(idx, v)}
                          onOpenChange={(o) => { if (o) onItemSelectOpen?.(); }}
                        >
                          <SelectTrigger className="h-7 text-xs min-w-[80px]">
                            <SelectValue placeholder={t("dish.selectItem", "Select item")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((it) => (
                              <SelectItem key={it.id} value={String(it.id)}>
                                {it.locales[0]?.name ?? it.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={row.quantity}
                          onChange={(e) =>
                            (props as CreateModeProps).onPatchRow(idx, { quantity: Number(e.target.value) })
                          }
                          className="h-7 w-12 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.unit_id ? String(row.unit_id) : ""}
                          disabled={!row.item_id || units.length === 0}
                          onValueChange={(v) =>
                            (props as CreateModeProps).onPatchRow(idx, { unit_id: Number(v) })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs min-w-[100px]">
                            <SelectValue placeholder={t("dish.selectUnit", "Unit")} />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.locales[0]?.name ?? u.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => (props as CreateModeProps).onRemoveRow(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              : savedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-sm">{getItemName(row.item_id)}</TableCell>
                    <TableCell className="text-sm">{row.quantity}</TableCell>
                    <TableCell className="text-sm">{getUnitNameById(row.unit_id)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

            {/* View mode: new row being added */}
            {!isCreate && adding && (() => {
              const units = getUnits(newRow.item_id);
              return (
                <TableRow>
                  <TableCell>
                    <Select
                      value={newRow.item_id ? String(newRow.item_id) : ""}
                      onValueChange={handleNewItemChange}
                      onOpenChange={(o) => { if (o) onItemSelectOpen?.(); }}
                    >
                      <SelectTrigger className="h-7 text-xs min-w-[80px]">
                        <SelectValue placeholder={t("dish.selectItem", "Select item")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map((it) => (
                          <SelectItem key={it.id} value={String(it.id)}>
                            {it.locales[0]?.name ?? it.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={newRow.quantity}
                      onChange={(e) => setNewRow((p) => ({ ...p, quantity: Number(e.target.value) }))}
                      className="h-7 w-12 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={newRow.unit_id ? String(newRow.unit_id) : ""}
                      disabled={!newRow.item_id || units.length === 0}
                      onValueChange={(v) => setNewRow((p) => ({ ...p, unit_id: Number(v) }))}
                    >
                      <SelectTrigger className="h-7 text-xs min-w-[100px]">
                        <SelectValue placeholder={t("dish.selectUnit", "Unit")} />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.locales[0]?.name ?? u.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600"
                        disabled={saving}
                        onClick={handleSaveNew}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => { setAdding(false); setNewRow({ item_id: "", quantity: 1, unit_id: "", sort_order: 1 }); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
