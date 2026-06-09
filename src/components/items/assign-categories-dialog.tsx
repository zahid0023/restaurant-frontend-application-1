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
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { itemCategoriesService } from "@/services/item-categories";
import type { ItemCategory } from "@/services/item-categories";
import { itemItemCategoriesService } from "@/services/item-item-categories";

interface CategoryWithName {
  category: ItemCategory;
  name: string;
}

interface NavEntry {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
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

  const [rootCategories, setRootCategories] = useState<CategoryWithName[]>([]);
  const [loadingRoots, setLoadingRoots] = useState(false);

  const [navStack, setNavStack] = useState<NavEntry[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryWithName[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const [confirmTarget, setConfirmTarget] = useState<{ categoryId: number; categoryName: string; action: "assign" | "unassign" } | null>(null);

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

  useEffect(() => {
    if (navStack.length === 0) return;
    const current = navStack[navStack.length - 1];
    loadSubcategories(current.categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navStack]);

  async function loadRoots() {
    setLoadingRoots(true);
    try {
      const res = await itemCategoriesService.listRoot({ size: 50, sort_by: "sortOrder" });
      setRootCategories(res.data.map((cat) => ({
        category: cat,
        name: cat.locales[0]?.name ?? cat.code,
      })));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingRoots(false);
    }
  }

  async function loadSubcategories(categoryId: number) {
    setLoadingSubs(true);
    setSubcategories([]);
    try {
      const res = await itemCategoriesService.listSubcategories(categoryId, { size: 50, sort_by: "sortOrder" });
      setSubcategories(res.data.map((cat) => ({
        category: cat,
        name: cat.locales[0]?.name ?? cat.code,
      })));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingSubs(false);
    }
  }

  function drillInto(cat: CategoryWithName) {
    setNavStack((prev) => [
      ...prev,
      {
        categoryId: cat.category.id,
        categoryName: cat.name,
        categoryCode: cat.category.code,
      },
    ]);
  }

  function navigateBack() {
    setNavStack((prev) => prev.slice(0, -1));
  }

  function navigateTo(index: number) {
    setNavStack((prev) => prev.slice(0, index + 1));
  }

  async function confirmAction() {
    if (!confirmTarget) return;
    const { categoryId, action } = confirmTarget;
    setConfirmTarget(null);
    if (action === "assign") {
      await handleAssign(categoryId);
    } else {
      await handleUnassign(categoryId);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("shopItem.assignCategories")}</DialogTitle>
            <DialogDescription>
              {itemName
                ? `${itemName} — ${t("shopItem.assignCategoriesDesc")}`
                : t("shopItem.assignCategoriesDesc")}
            </DialogDescription>
          </DialogHeader>

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

        {!isInRoot && (
          <div className="px-6 py-2 border-b shrink-0 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 -ml-1"
              onClick={navigateBack}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {currentNav?.categoryName}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isInRoot ? (
            loadingRoots ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("item.loading")}</span>
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 border-2 border-dashed rounded-xl text-muted-foreground">
                <Tag className="h-7 w-7 opacity-30" />
                <p className="text-sm">{t("shopItem.noCategoriesAvailable")}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {rootCategories.map((item) => (
                  <CategoryRow
                    key={item.category.id}
                    item={item}
                    assignedIds={assignedIds}
                    pendingIds={pendingIds}
                    onAssign={(id, name) => setConfirmTarget({ categoryId: id, categoryName: name, action: "assign" })}
                    onUnassign={(id, name) => setConfirmTarget({ categoryId: id, categoryName: name, action: "unassign" })}
                    onDrillIn={() => drillInto(item)}
                    t={t}
                  />
                ))}
              </div>
            )
          ) : (
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
                    onAssign={(id, name) => setConfirmTarget({ categoryId: id, categoryName: name, action: "assign" })}
                    onUnassign={(id, name) => setConfirmTarget({ categoryId: id, categoryName: name, action: "unassign" })}
                    onDrillIn={() => drillInto(item)}
                    t={t}
                  />
                ))}
              </div>
            )
          )}
        </div>
        <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmTarget?.action === "assign" ? t("shopItem.assignConfirmTitle") : t("shopItem.unassignConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmTarget?.action === "assign" ? t("shopItem.assignConfirmDesc") : t("shopItem.unassignConfirmDesc")}
                {confirmTarget && <span className="block font-medium mt-1">{confirmTarget.categoryName}</span>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction}>{t("common.confirm")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryRowProps {
  item: CategoryWithName;
  assignedIds: Set<number>;
  pendingIds: Set<number>;
  onAssign: (id: number, name: string) => void;
  onUnassign: (id: number, name: string) => void;
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
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
        {category.code.slice(0, 2).toUpperCase()}
      </div>

      <button type="button" className="flex-1 min-w-0 text-left" onClick={onDrillIn}>
        <p className="text-sm font-medium truncate leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground font-mono leading-tight">{category.code}</p>
      </button>

      {isAssigned && (
        <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {t("shopItem.assigned")}
        </Badge>
      )}

      <Button
        size="sm"
        variant={isAssigned ? "outline" : "default"}
        className="h-7 text-xs px-2.5 shrink-0"
        disabled={isPending}
        onClick={() => isAssigned ? onUnassign(category.id, name) : onAssign(category.id, name)}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isAssigned ? (
          t("shopItem.unassign")
        ) : (
          t("shopItem.assign")
        )}
      </Button>

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
