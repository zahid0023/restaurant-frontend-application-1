"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DishCard } from "@/components/dishes/dish-card";
import { DishDialog, emptyDishForm } from "@/components/dishes/dish-dialog";
import type { DishDialogMode, DishFormState } from "@/components/dishes/types";
import { dishesService, type Dish } from "@/services/dishes";
import { menuCategoriesService, type MenuCategory } from "@/services/menu-categories";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

export default function DishesPage() {
  const { t } = useTranslation();

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DishDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<DishFormState>(emptyDishForm);

  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);

  const selectedCategory = useMemo(
    () => menuCategories.find((c) => c.id === selectedCategoryId) ?? null,
    [menuCategories, selectedCategoryId],
  );

  useEffect(() => {
    menuCategoriesService.list({ size: 50, sort_by: "sortOrder" })
      .then((r) => setMenuCategories(r.data))
      .catch(() => {});
    localesApi.list({ size: 50, sort_by: "sortOrder" })
      .then((r) => setAvailableLocales(r.data))
      .catch(() => {});
  }, []);

  async function refreshDishes(categoryId: number) {
    setLoading(true);
    try {
      const res = await dishesService.list(categoryId, { size: 50, sort_by: "sortOrder" });
      setDishes(res.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSaved() {
    if (selectedCategoryId == null) return;
    const listRes = await dishesService.list(selectedCategoryId, { size: 50, sort_by: "sortOrder" });
    setDishes(listRes.data);
    // sync dialog form locales if open
    if (dialogOpen && activeId != null) {
      try {
        const dishRes = await dishesService.get(selectedCategoryId, activeId);
        setForm((prev) => ({
          ...prev,
          locales: (dishRes.dish.locales ?? []).map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        }));
      } catch {}
    }
  }

  function handleCategoryChange(value: string) {
    const id = Number(value);
    setSelectedCategoryId(id);
    setSearch("");
    refreshDishes(id);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dishes;
    return dishes.filter((d) =>
      d.code.toLowerCase().includes(q) ||
      (d.locales?.[0]?.name ?? "").toLowerCase().includes(q)
    );
  }, [dishes, search]);

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyDishForm);
    setDialogOpen(true);
  }

  async function openView(dish: Dish) {
    if (selectedCategoryId == null) return;
    try {
      const res = await dishesService.get(selectedCategoryId, dish.id);
      setForm({
        code: res.dish.code,
        sort_order: res.dish.sort_order,
        is_veg: res.dish.is_veg ?? false,
        locales: (res.dish.locales ?? []).map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      });
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }
    setMode("view");
    setActiveId(dish.id);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget || selectedCategoryId == null) return;
    try {
      await dishesService.remove(selectedCategoryId, deleteTarget.id);
      toast.success(`${t("dish.deletedToast")}: ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refreshDishes(selectedCategoryId);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("dish.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dish.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCategoryId ? String(selectedCategoryId) : ""}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-56 bg-muted text-foreground">
              <SelectValue placeholder={t("dish.selectCategoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {menuCategories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.locales?.[0]?.name ? `${c.locales[0].name} (${c.code})` : c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCategoryId != null && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${t("common.search")}…`}
                  className="pl-9 pr-9 w-52"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1.5" /> {t("dish.new")}
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedCategoryId == null ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("dish.selectCategory")}
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("dish.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("dish.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DishCard
              key={d.id}
              dish={d}
              onView={openView}
              onDelete={(dish) => setDeleteTarget(dish)}
            />
          ))}
        </div>
      )}

      {selectedCategory != null && (
        <DishDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={mode}
          menuId={selectedCategory.menu_id}
          menuCategoryId={selectedCategory.id}
          dishId={activeId}
          form={form}
          onFormChange={setForm}
          availableLocales={availableLocales}
          onSaved={onSaved}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dish.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dish.deleteDesc", { code: deleteTarget?.code ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
