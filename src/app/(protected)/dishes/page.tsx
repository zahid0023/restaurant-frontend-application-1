"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderOpen, LayoutGrid, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { InfiniteScrollSentinel } from "@/components/ui/infinite-scroll-sentinel";
import { DishCard } from "@/components/dishes/dish-card";
import { DishDialog, emptyDishForm } from "@/components/dishes/dish-dialog";
import { DishOverviewDialog } from "@/components/dishes/dish-overview-dialog";
import { AssignMenuCategoriesDialog } from "@/components/dishes/assign-menu-categories-dialog";
import type { DishDialogMode, DishFormState } from "@/components/dishes/types";
import { dishesService, type Dish } from "@/services/dishes";
import { menusService, type Menu, type MenuCategory, type MenuDish } from "@/services/menus";
import { localesApi, type Locale } from "@/services/locales";
import { toast } from "sonner";

type DishView = "all" | "by-category";

interface CategoryGroup {
  category: MenuCategory;
  dishes: MenuDish[];
}

interface MenuDishGroup {
  menu: Menu;
  categories: CategoryGroup[];
}

export default function DishesPage() {
  const { t } = useTranslation();

  const [view, setView] = useState<DishView>("all");
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DishDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<DishFormState>(emptyDishForm);

  const [overviewTarget, setOverviewTarget] = useState<Dish | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dish | null>(null);
  const [assignTarget, setAssignTarget] = useState<Dish | null>(null);

  // --- All Dishes view (infinite scroll) ---
  const { items: dishes, loading, loadingMore, hasNext, sentinelRef, reset } =
    useInfiniteScroll({
      fetchFn: dishesService.list,
      params: { size: 20, sort_by: "sortOrder", query: search.trim() || undefined },
    });

  // --- By Category view ---
  const [groupedView, setGroupedView] = useState<MenuDishGroup[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  useEffect(() => {
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "by-category") loadGrouped();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function loadGrouped() {
    setGroupedLoading(true);
    try {
      const res = await menusService.list({ size: 50, sort_by: "sortOrder", detail: "FULL" });
      const groups: MenuDishGroup[] = res.data
        .map((menu) => ({
          menu,
          categories: (menu.categories ?? [])
            .map((cat) => ({ category: cat, dishes: cat.dishes ?? [] }))
            .filter((c) => c.dishes.length > 0),
        }))
        .filter((g) => g.categories.length > 0);
      setGroupedView(groups);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGroupedLoading(false);
    }
  }

  const dishNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const d of dishes) out[d.id] = d.locales?.[0]?.name ?? "";
    return out;
  }, [dishes]);

  const filteredGrouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedView;
    return groupedView.map((g) => ({
      ...g,
      categories: g.categories
        .map((c) => ({
          ...c,
          dishes: c.dishes.filter(
            (d) =>
              d.code.toLowerCase().includes(q) ||
              d.locales?.[0]?.name?.toLowerCase().includes(q)
          ),
        }))
        .filter((c) => c.dishes.length > 0),
    })).filter((g) => g.categories.length > 0);
  }, [groupedView, search]);

  function handleSaved() {
    if (view === "by-category") loadGrouped();
    else reset();
  }

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyDishForm);
    setDialogOpen(true);
  }

  async function openDetail(dish: Dish | MenuCategoryDish) {
    setMode("view");
    setActiveId(dish.id);
    setForm({ code: dish.code, sort_order: dish.sort_order, locales: [] });
    setDialogOpen(true);
    try {
      const res = await dishesService.get(dish.id);
      setForm((prev) => ({
        ...prev,
        locales: (res.dish.locales ?? []).map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      }));
    } catch { /* non-blocking */ }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await dishesService.remove(deleteTarget.id);
      toast.success(`${t("dish.deletedToast")}: ${deleteTarget.code}`);
      setDeleteTarget(null);
      if (view === "by-category") loadGrouped();
      else reset();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const hasGroupedResults = filteredGrouped.length > 0;

  return (
    <div className="relative max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("dish.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dish.pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
            <Button
              size="sm"
              variant={view === "all" ? "default" : "ghost"}
              className="h-7 px-2.5 gap-1.5 text-xs"
              onClick={() => setView("all")}
            >
              <LayoutGrid className="h-3 w-3" />
              {t("dish.viewAll")}
            </Button>
            <Button
              size="sm"
              variant={view === "by-category" ? "default" : "ghost"}
              className="h-7 px-2.5 gap-1.5 text-xs"
              onClick={() => setView("by-category")}
            >
              <FolderOpen className="h-3 w-3" />
              {t("dish.viewByCategory")}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t("common.search")}…`}
              className="pl-9 pr-9 w-64"
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
        </div>
      </div>

      {/* All Dishes view */}
      {view === "all" && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("dish.empty")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dishes.map((d) => (
                <DishCard
                  key={d.id}
                  dish={d}
                  defaultName={dishNames[d.id]}
                  onOverview={(dish) => setOverviewTarget(dish)}
                  onView={openDetail}
                  onDelete={(dish) => setDeleteTarget(dish)}
                  onAssignCategories={(dish) => setAssignTarget(dish)}
                />
              ))}
            </div>
            <InfiniteScrollSentinel sentinelRef={sentinelRef} loadingMore={loadingMore} hasNext={hasNext} />
          </>
        )
      )}

      {/* By Category view */}
      {view === "by-category" && (
        groupedLoading ? (
          <div className="space-y-10">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-40 rounded-md bg-muted animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-36 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasGroupedResults ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("dish.noDishesByCategory")}
          </div>
        ) : (
          <div className="space-y-14">
            {filteredGrouped.map(({ menu, categories }) => (
              <div key={menu.id} className="space-y-8">
                {/* Menu type header */}
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-6 w-6 text-primary shrink-0" />
                  <h2 className="text-2xl font-semibold">
                    {menu.locales?.[0]?.name ?? menu.code}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">({menu.code})</span>
                </div>

                {/* Categories */}
                {categories.map(({ category, dishes: catDishes }) => {
                  const catName = category.locales?.[0]?.name ?? category.code;
                  return (
                    <div key={category.id} className="space-y-3 pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{catName}</h3>
                        <span className="text-xs text-muted-foreground font-mono">({category.code})</span>
                        <span className="ml-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">
                          {catDishes.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catDishes.map((d) => (
                          <DishCard
                            key={d.id}
                            dish={d as Dish}
                            defaultName={d.locales?.[0]?.name}
                            onOverview={() => setOverviewTarget(d as Dish)}
                            onView={() => openDetail(d)}
                            onDelete={() => setDeleteTarget(d as Dish)}
                            onAssignCategories={() => setAssignTarget(d as Dish)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )
      )}

      <DishOverviewDialog
        open={!!overviewTarget}
        onOpenChange={(o) => !o && setOverviewTarget(null)}
        dish={overviewTarget}
        dishName={overviewTarget ? (dishNames[overviewTarget.id] || overviewTarget.code) : undefined}
      />

      <DishDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        dishId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AssignMenuCategoriesDialog
        open={!!assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
        dishId={assignTarget?.id ?? 0}
        dishName={assignTarget ? (dishNames[assignTarget.id] || assignTarget.code) : undefined}
      />

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
