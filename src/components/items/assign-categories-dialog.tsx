"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { itemTypesService } from "@/services/item-types";
import type { ItemType } from "@/services/item-types";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory } from "@/services/item-categories";
import { itemItemCategoriesService } from "@/services/item-item-categories";

interface CategoryWithName {
  category: ItemCategory;
  name: string;
}

interface RootGroup {
  itemType: ItemType;
  categories: CategoryWithName[];
}

interface NavEntry {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  itemTypeId: number;
}

export interface AssignCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemName?: string;
}

export function AssignCategoriesDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
}: AssignCategoriesDialogProps) {
  const { t } = useTranslation();

  // Root level data — loaded once on open
  const [rootGroups, setRootGroups] = useState<RootGroup[]>([]);
  const [loadingRoots, setLoadingRoots] = useState(false);

  // Drill-down navigation stack
  const [navStack, setNavStack] = useState<NavEntry[]>([]);

  // Subcategories for current level (non-empty navStack)
  const [subcategories, setSubcategories] = useState<CategoryWithName[]>([]);
  const [loadingSubs, setLoadingySubs] = useState(false);

  // Assign state
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  // Reset and load roots when dialog opens
  useEffect(() => {
    if (!open) {
      setNavStack([]);
      setSubcategories([]);
      return;
    }
    setAssignedIds(new Set());
    setPendingIds(new Set());
    setNavStack([]);
    setSubcategories([]);
    loadRoots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId]);

  // Load subcategories whenever navStack changes to a non-empty state
  useEffect(() => {
    if (navStack.length === 0) return;
    const current = navStack[navStack.length - 1];
    loadSubcategories(current.itemTypeId, current.categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStack]);

  async function loadRoots() {
    setLoadingRoots(true);
    try {
      const typesRes = await itemTypesService.list({ size: 50, sort_by: "sortOrder" });
      const groups: RootGroup[] = [];
      await Promise.all(
        typesRes.data.map(async (itemType) => {
          try {
            const rootRes = await itemCategoriesService.listRoot(itemType.id);
            if (rootRes.data.length === 0) return;
            const withNames = await Promise.all(
              rootRes.data.map(async (cat): Promise<CategoryWithName> => {
                try {
                  const locRes = await itemCategoriesService.listLocales(itemType.id, cat.id, { size: 5, sort_by: "sortOrder" });
                  return { category: cat, name: locRes.data[0]?.name ?? cat.code };
                } catch {
                  return { category: cat, name: cat.code };
                }
              }),
            );
            groups.push({ itemType, categories: withNames });
          } catch { /* skip */ }
        }),
      );
      groups.sort((a, b) => a.itemType.sort_order - b.itemType.sort_order);
      setRootGroups(groups);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingRoots(false);
    }
  }

  async function loadSubcategories(itemTypeId: number, categoryId: number) {
    setLoadingySubs(true);
    setSubcategories([]);
    try {
      const res = await itemCategoriesService.listSubcategories(itemTypeId, categoryId);
      const withNames = await Promise.all(
        res.data.map(async (cat): Promise<CategoryWithName> => {
          try {
            const locRes = await itemCategoriesService.listLocales(itemTypeId, cat.id, { size: 5, sort_by: "sortOrder" });
            return { category: cat, name: locRes.data[0]?.name ?? cat.code };
          } catch {
            return { category: cat, name: cat.code };
          }
        }),
      );
      setSubcategories(withNames);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingySubs(false);
    }
  }

  function drillInto(cat: CategoryWithName, itemTypeId: number) {
    setNavStack((prev) => [
      ...prev,
      {
        categoryId: cat.category.id,
        categoryName: cat.name,
        categoryCode: cat.category.code,
        itemTypeId,
      },
    ]);
  }

  function navigateBack() {
    setNavStack((prev) => prev.slice(0, -1));
  }

  function navigateTo(index: number) {
    setNavStack((prev) => prev.slice(0, index + 1));
  }

  async function handleAssign(categoryId: number) {
    setPendingIds((prev) => new Set(prev).add(categoryId));
    try {
      await itemItemCategoriesService.assign(itemId, categoryId);
      setAssignedIds((prev) => new Set(prev).add(categoryId));
      toast.success(t("shopItem.assignedToast"));
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.toLowerCase().includes("already assigned")) {
        setAssignedIds((prev) => new Set(prev).add(categoryId));
      } else {
        toast.error(msg);
      }
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    }
  }

  async function handleUnassign(categoryId: number) {
    setPendingIds((prev) => new Set(prev).add(categoryId));
    try {
      await itemItemCategoriesService.unassign(itemId, categoryId);
      setAssignedIds((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
      toast.success(t("shopItem.unassignedToast"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    }
  }

  const isInRoot = navStack.length === 0;
  const currentNav = navStack[navStack.length - 1] ?? null;
  const totalRoots = rootGroups.reduce((s, g) => s + g.categories.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("shopItem.assignCategories")}</DialogTitle>
            <DialogDescription>
              {itemName
                ? `${itemName} — ${t("shopItem.assignCategoriesDesc")}`
                : t("shopItem.assignCategoriesDesc")}
            </DialogDescription>
          </DialogHeader>

          {/* Breadcrumb — only visible when drilled in */}
          {!isInRoot && (
            <div className="flex items-center gap-1 mt-3 flex-wrap">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setNavStack([])}
              >
                {t("itemCategory.allCategories")}
              </button>
              {navStack.map((entry, i) => (
                <span key={entry.categoryId} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  {i < navStack.length - 1 ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[8rem]"
                      onClick={() => navigateTo(i)}
                    >
                      {entry.categoryName}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold truncate max-w-[8rem]">
                      {entry.categoryName}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Back button row when drilled in */}
        {!isInRoot && (
          <div className="px-6 py-2 border-b shrink-0 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 -ml-1"
              onClick={navigateBack}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("itemType.backToTypes").replace("Item Types", currentNav?.categoryName ?? "")}
            </Button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isInRoot ? (
            /* Root categories view */
            loadingRoots ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("item.loading")}</span>
              </div>
            ) : totalRoots === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 border-2 border-dashed rounded-xl text-muted-foreground">
                <Tag className="h-7 w-7 opacity-30" />
                <p className="text-sm">{t("shopItem.noCategoriesAvailable")}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {rootGroups.map(({ itemType, categories }) => (
                  <div key={itemType.id} className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {itemType.code}
                    </p>
                    {categories.map((item) => (
                      <CategoryRow
                        key={item.category.id}
                        item={item}
                        assignedIds={assignedIds}
                        pendingIds={pendingIds}
                        onAssign={handleAssign}
                        onUnassign={handleUnassign}
                        onDrillIn={() => drillInto(item, itemType.id)}
                        t={t}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Subcategory view */
            loadingSubs ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("item.loading")}</span>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 border-2 border-dashed rounded-xl text-muted-foreground">
                <Tag className="h-7 w-7 opacity-30" />
                <p className="text-sm">{t("itemCategory.noSubcategories")}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {subcategories.map((item) => (
                  <CategoryRow
                    key={item.category.id}
                    item={item}
                    assignedIds={assignedIds}
                    pendingIds={pendingIds}
                    onAssign={handleAssign}
                    onUnassign={handleUnassign}
                    onDrillIn={() => drillInto(item, currentNav!.itemTypeId)}
                    t={t}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryRowProps {
  item: CategoryWithName;
  assignedIds: Set<number>;
  pendingIds: Set<number>;
  onAssign: (id: number) => void;
  onUnassign: (id: number) => void;
  onDrillIn: () => void;
  t: (key: string) => string;
}

function CategoryRow({ item, assignedIds, pendingIds, onAssign, onUnassign, onDrillIn, t }: CategoryRowProps) {
  const { category, name } = item;
  const isAssigned = assignedIds.has(category.id);
  const isPending = pendingIds.has(category.id);

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
        isAssigned ? "bg-primary/5 border-primary/20" : "border-border/60 hover:bg-muted/40"
      }`}
    >
      {/* Avatar */}
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
        {category.code.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + code — clicking drills in */}
      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={onDrillIn}
      >
        <p className="text-sm font-medium truncate leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground font-mono leading-tight">{category.code}</p>
      </button>

      {/* Assigned badge */}
      {isAssigned && (
        <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {t("shopItem.assigned")}
        </Badge>
      )}

      {/* Assign / Unassign */}
      <Button
        size="sm"
        variant={isAssigned ? "outline" : "default"}
        className="h-7 text-xs px-2.5 shrink-0"
        disabled={isPending}
        onClick={() => isAssigned ? onUnassign(category.id) : onAssign(category.id)}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isAssigned ? (
          t("shopItem.unassign")
        ) : (
          t("shopItem.assign")
        )}
      </Button>

      {/* Drill-in chevron */}
      <button
        type="button"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        onClick={onDrillIn}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
