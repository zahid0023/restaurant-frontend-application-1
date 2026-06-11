"use client";

import { useEffect, useMemo, useState } from "react";
import { ChefHat, FolderOpen, LayoutGrid, Plus, Search, X } from "lucide-react";
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
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { InfiniteScrollSentinel } from "@/components/ui/infinite-scroll-sentinel";
import { MenuCategoryCard } from "@/components/menu-categories/menu-category-card";
import { MenuCategoryDialog, emptyMenuCategoryForm } from "@/components/menu-categories/menu-category-dialog";
import type { MenuCategoryDialogMode, MenuCategoryFormState } from "@/components/menu-categories/types";
import { menuCategoriesService } from "@/services/menu-categories";
import type { MenuCategory } from "@/services/menu-categories";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { menusService } from "@/services/menus";
import type { Menu } from "@/services/menus";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name";
type CategoryView = "all" | "by-menu-type";

const PAGE_SIZE = 20;

interface MenuGroup {
  menu: Menu;
  categories: MenuCategory[];
}

export default function MenuCategoriesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
  };

  const [view, setView] = useState<CategoryView>("all");
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [availableMenuTypes, setAvailableMenuTypes] = useState<Menu[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  // --- All Categories view (infinite scroll) ---
  const { items: allCategories, loading: allLoading, loadingMore, hasNext, sentinelRef, reset } =
    useInfiniteScroll({
      fetchFn: menuCategoriesService.listAll,
      params: { size: PAGE_SIZE, sort_by: "sortOrder", query: search.trim() || undefined },
    });

  // --- By Menu Type view state ---
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);
  const [groupedLoaded, setGroupedLoaded] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<MenuCategoryDialogMode>("create");
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<MenuCategoryFormState>(emptyMenuCategoryForm);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);

  // Load By Menu Type: GET /menus?detail=WITH_CATEGORIES
  async function loadByMenuType() {
    setGroupedLoading(true);
    try {
      const res = await menusService.list({ size: 50, sort_by: "sortOrder", detail: "WITH_CATEGORIES" });
      setMenuGroups(
        res.data.map((m) => ({ menu: m, categories: (m.categories ?? []) as MenuCategory[] }))
      );
      if (availableMenuTypes.length === 0) setAvailableMenuTypes(res.data);
      setGroupedLoaded(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGroupedLoading(false);
    }
  }

  useEffect(() => {
    menusService.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableMenuTypes(r.data)).catch(() => {});
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "by-menu-type" && !groupedLoaded) loadByMenuType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  function refresh() {
    if (view === "all") reset();
    else {
      setGroupedLoaded(false);
      loadByMenuType();
    }
  }

  // Category names for grouped view
  const categoryNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const c of allCategories) out[c.id] = c.locales?.[0]?.name ?? "";
    for (const { categories } of menuGroups) {
      for (const c of categories) out[c.id] = c.locales?.[0]?.name ?? "";
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCategories, menuGroups, locale]);

  function matchesSearch(c: MenuCategory): boolean {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const code = c.code.toLowerCase();
    const name = (categoryNames[c.id] ?? "").toLowerCase();
    switch (searchField) {
      case "code": return code.includes(q);
      case "name": return name.includes(q);
      default: return code.includes(q) || name.includes(q);
    }
  }

  // --- By Menu Type view: client-side filtered groups ---
  const filteredGroups = useMemo(
    () =>
      menuGroups
        .map((g) => ({ ...g, categories: g.categories.filter(matchesSearch) }))
        .filter((g) => g.categories.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menuGroups, search, searchField, categoryNames]
  );

  function handleSearchChange(val: string) {
    setSearch(val);
  }

  function handleSearchFieldChange(val: SearchField) {
    setSearchField(val);
  }

  function openCreate() {
    setMode("create");
    setActiveId(undefined);
    setForm(emptyMenuCategoryForm);
    setDialogOpen(true);
  }

  function openDetail(c: MenuCategory) {
    setMode("view");
    setActiveId(c.id);
    setForm({
      menu_type_id: "",
      code: c.code,
      sort_order: c.sort_order,
      locales: (c.locales ?? []).map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await menuCategoriesService.remove(deleteTarget.id);
      toast.success(`${t("menuCategory.deletedToast")} ${deleteTarget.code}`);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("menuCategory.pageTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("menuCategory.pageSubtitle")}</p>
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
              {t("menuCategory.viewAll")}
            </Button>
            <Button
              size="sm"
              variant={view === "by-menu-type" ? "default" : "ghost"}
              className="h-7 px-2.5 gap-1.5 text-xs"
              onClick={() => setView("by-menu-type")}
            >
              <ChefHat className="h-3 w-3" />
              {t("menuCategory.viewByMenuType")}
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => handleSearchFieldChange(v as SearchField)}>
              <SelectTrigger className="w-36 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allFields")}</SelectItem>
                <SelectItem value="code">{t("common.code")}</SelectItem>
                <SelectItem value="name">{t("common.localizedName")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`${t("common.search")} ${searchFieldLabels[searchField].toLowerCase()}…`}
                className="pl-9 pr-9 w-64 rounded-l-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("menuCategory.new")}
          </Button>
        </div>
      </div>

      {/* All Categories — infinite scroll */}
      {view === "all" && (
        allLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : allCategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("menuCategory.empty")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCategories.map((c) => (
                <MenuCategoryCard
                  key={c.id}
                  category={c}
                  defaultName={categoryNames[c.id]}
                  onView={openDetail}
                  onDelete={(cat) => setDeleteTarget(cat)}
                />
              ))}
            </div>
            <InfiniteScrollSentinel sentinelRef={sentinelRef} loadingMore={loadingMore} hasNext={hasNext} />
          </>
        )
      )}

      {/* By Menu Type — grouped */}
      {view === "by-menu-type" && (
        groupedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("menuCategory.empty")}
          </div>
        ) : (
          <div className="space-y-14">
            {filteredGroups.map(({ menu, categories }) => {
              const menuName = menu.locales?.[0]?.name ?? menu.code;
              return (
                <div key={menu.id} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <FolderOpen className="h-6 w-6 text-primary shrink-0" />
                    <h2 className="text-2xl font-semibold">{menuName}</h2>
                    <span className="text-xs text-muted-foreground font-mono">({menu.code})</span>
                    <span className="ml-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 tabular-nums">
                      {categories.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((c) => (
                      <MenuCategoryCard
                        key={c.id}
                        category={c}
                        defaultName={categoryNames[c.id]}
                        onView={openDetail}
                        onDelete={(cat) => setDeleteTarget(cat)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <MenuCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        categoryId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        availableMenuTypes={availableMenuTypes}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("menuCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("menuCategory.deleteDesc", { code: deleteTarget?.code ?? "" })}
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
