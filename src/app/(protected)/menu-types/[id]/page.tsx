"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search, Tag, X, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { MenuTypeDialog, emptyMenuTypeForm } from "@/components/menu-types/menu-type-dialog";
import type { MenuTypeDialogMode, MenuTypeFormState } from "@/components/menu-types/types";
import { MenuCategoryDialog } from "@/components/menu-categories/menu-category-dialog";
import type { MenuCategoryDialogMode, MenuCategoryFormState } from "@/components/menu-categories/types";
import { MenuCategoryCard } from "@/components/menu-categories/menu-category-card";
import { menusService } from "@/services/menus";
import type { Menu, MenuCategory as AssignedMenuCategory } from "@/services/menus";
import { menuCategoriesService } from "@/services/menu-categories";
import type { MenuCategory } from "@/services/menu-categories";
import { menuMenuCategoriesService } from "@/services/menu-menu-categories";
import { localesApi } from "@/services/locales";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type SearchField = "all" | "code" | "name";

export default function MenuTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const menuId = Number(idStr);

  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const searchFieldLabels: Record<SearchField, string> = {
    all: t("common.allFields"),
    code: t("common.code"),
    name: t("common.localizedName"),
  };

  // Full menu with locales + menu_categories (each with their own locales)
  const [menu, setMenu] = useState<Menu | null>(null);
  // All global categories — used only for the assign dropdown
  const [allCategories, setAllCategories] = useState<MenuCategory[]>([]);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");

  // Assign
  const [selectedToAssign, setSelectedToAssign] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Unassign
  const [unassignTarget, setUnassignTarget] = useState<AssignedMenuCategory | null>(null);
  const [pendingUnassign, setPendingUnassign] = useState(false);

  // Menu type edit dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeDialogMode, setTypeDialogMode] = useState<MenuTypeDialogMode>("edit");
  const [typeForm, setTypeForm] = useState<MenuTypeFormState>(emptyMenuTypeForm);

  // Category edit dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catMode, setCatMode] = useState<MenuCategoryDialogMode>("edit");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [catForm, setCatForm] = useState<MenuCategoryFormState>({ code: "", sort_order: 0, locales: [] });

  async function refresh() {
    setLoading(true);
    try {
      const [menuRes, allRes] = await Promise.all([
        menusService.get(menuId),                  // menu + menu_categories with locales
        menuCategoriesService.list({ size: 50 }),  // only for assign dropdown
      ]);
      setMenu(menuRes.menu);
      setAllCategories(allRes.data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!menuId) return;
    refresh();
    localesApi.list({ size: 50, sort_by: "sortOrder" }).then((r) => setAvailableLocales(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  // Assigned categories come directly from the menu type API response (with locales embedded)
  const assignedCategories = menu?.menu_categories ?? [];

  const assignedIds = useMemo(() => new Set(assignedCategories.map((c) => c.id)), [assignedCategories]);

  // Locale names from the embedded locales — no separate lookup needed
  const categoryNames = useMemo(() => {
    const out: Record<number, string> = {};
    for (const cat of assignedCategories) {
      out[cat.id] = cat.locales?.[0]?.name ?? "";
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedCategories, locale]);

  // Unassigned: from global list, filtered — only used for assign dropdown
  const unassignedCategories = useMemo(
    () => allCategories.filter((c) => !assignedIds.has(c.id)),
    [allCategories, assignedIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignedCategories;
    return assignedCategories.filter((c) => {
      const code = c.code.toLowerCase();
      const name = (categoryNames[c.id] ?? "").toLowerCase();
      switch (searchField) {
        case "code": return code.includes(q);
        case "name": return name.includes(q);
        default: return code.includes(q) || name.includes(q);
      }
    });
  }, [assignedCategories, categoryNames, search, searchField]);

  function openTypeEdit() {
    if (!menu) return;
    setTypeDialogMode("edit");
    setTypeForm({
      code: menu.code,
      sort_order: menu.sort_order,
      locales: (menu.locales ?? []).map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setTypeDialogOpen(true);
  }

  async function handleAssign() {
    if (!selectedToAssign) return;
    setAssigning(true);
    try {
      await menuMenuCategoriesService.assign(menuId, Number(selectedToAssign));
      toast.success(t("menuMenuCategory.assignedToast"));
      setSelectedToAssign("");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  function openViewCat(cat: AssignedMenuCategory) {
    setCatMode("view");
    setActiveCatId(cat.id);
    setCatForm({
      code: cat.code,
      sort_order: cat.sort_order,
      locales: (cat.locales ?? []).map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setCatDialogOpen(true);
  }

  function openEditCat(cat: AssignedMenuCategory) {
    setCatMode("edit");
    setActiveCatId(cat.id);
    // Locales come directly from the menu type API response
    setCatForm({
      code: cat.code,
      sort_order: cat.sort_order,
      locales: (cat.locales ?? []).map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
    setCatDialogOpen(true);
  }

  async function confirmUnassign() {
    if (!unassignTarget) return;
    setPendingUnassign(true);
    try {
      await menuMenuCategoriesService.unassign(menuId, unassignTarget.id);
      toast.success(t("menuMenuCategory.unassignedToast"));
      setUnassignTarget(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingUnassign(false);
    }
  }

  const menuDisplayName = menu?.locales?.[0]?.name?.trim() || menu?.code || `#${menuId}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back + header */}
      <div className="space-y-4">
        <Link
          href="/menu-types"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("menuType.backToTypes")}
        </Link>

        {menu ? (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
              <h1 className="text-3xl font-semibold tracking-tight">{menuDisplayName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-mono">{menu.code}</span>
                <Badge variant="secondary" className="text-xs">#{menu.sort_order}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={openTypeEdit}>
              <Pencil className="h-4 w-4 mr-1.5" /> {t("menuType.editType")}
            </Button>
          </div>
        ) : (
          <div className="h-14 animate-pulse bg-muted rounded-lg" />
        )}
      </div>

      {/* Categories section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("menuCategory.pageTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t("menuCategory.pageSubtitle")}</p>
          </div>

          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-36 h-10 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0">
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")} ${searchFieldLabels[searchField].toLowerCase()}…`}
                className="pl-9 pr-9 w-56 h-10 rounded-l-none"
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
          </div>
        </div>

        {/* Assign dropdown — uses global category list to show unassigned options */}
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={selectedToAssign} onValueChange={setSelectedToAssign}>
            <SelectTrigger className="flex-1 h-9 bg-background">
              <SelectValue placeholder={t("menuMenuCategory.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {unassignedCategories.map((c) => {
                const name = c.locales?.[0]?.name;
                return (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {name ? `${name} (${c.code})` : c.code}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!selectedToAssign || assigning} onClick={handleAssign}>
            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : t("menuMenuCategory.assign")}
          </Button>
        </div>

        {/* Assigned category cards */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("menuCategory.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {search ? t("menuCategory.empty") : t("menuMenuCategory.noAssigned")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <MenuCategoryCard
                key={cat.id}
                category={{ ...cat, menu_id: menuId }}
                defaultName={categoryNames[cat.id]}
                onView={() => openViewCat(cat)}
                onEdit={() => openEditCat(cat)}
                onDelete={() => setUnassignTarget(cat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Menu type edit dialog */}
      <MenuTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        mode={typeDialogMode}
        onModeChange={setTypeDialogMode}
        menuTypeId={menuId}
        form={typeForm}
        onFormChange={setTypeForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      {/* Category edit dialog */}
      <MenuCategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        mode={catMode}
        onModeChange={setCatMode}
        categoryId={activeCatId}
        menuId={menuId}
        form={catForm}
        onFormChange={setCatForm}
        availableLocales={availableLocales}
        onSaved={refresh}
      />

      {/* Unassign confirmation */}
      <AlertDialog open={!!unassignTarget} onOpenChange={(o) => !o && setUnassignTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("menuMenuCategory.unassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("menuMenuCategory.unassignDesc", { code: unassignTarget?.code ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingUnassign}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassign} disabled={pendingUnassign}>
              {pendingUnassign ? <Loader2 className="h-4 w-4 animate-spin" /> : t("menuMenuCategory.unassign")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
