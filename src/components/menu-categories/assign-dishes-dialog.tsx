"use client";

import { useEffect, useState } from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
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
import { menuCategoriesService } from "@/services/menu-categories";
import { dishesService, type Dish } from "@/services/dishes";

export interface AssignDishesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  categoryName?: string;
}

export function AssignDishesDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: AssignDishesDialogProps) {
  const { t } = useTranslation();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<{
    dishId: number;
    dishName: string;
    action: "assign" | "unassign";
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setDishes([]);
      setAssignedIds(new Set());
      setPendingIds(new Set());
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId]);

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, dishesRes] = await Promise.all([
        menuCategoriesService.get(categoryId),
        dishesService.list({ size: 50, sort_by: "sortOrder" }),
      ]);
      setDishes(dishesRes.data);
      setAssignedIds(new Set((catRes.menu_category.dishes ?? []).map((d) => d.id)));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction() {
    if (!confirmTarget) return;
    const { dishId, action } = confirmTarget;
    setConfirmTarget(null);
    if (action === "assign") {
      await handleAssign(dishId);
    } else {
      await handleUnassign(dishId);
    }
  }

  async function handleAssign(dishId: number) {
    setPendingIds((prev) => new Set(prev).add(dishId));
    try {
      await menuCategoriesService.assignDish(categoryId, dishId);
      setAssignedIds((prev) => new Set(prev).add(dishId));
      toast.success(t("menuCategoryDish.assignedToast"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingIds((prev) => { const n = new Set(prev); n.delete(dishId); return n; });
    }
  }

  async function handleUnassign(dishId: number) {
    setPendingIds((prev) => new Set(prev).add(dishId));
    try {
      await menuCategoriesService.unassignDish(categoryId, dishId);
      setAssignedIds((prev) => { const n = new Set(prev); n.delete(dishId); return n; });
      toast.success(t("menuCategoryDish.unassignedToast"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingIds((prev) => { const n = new Set(prev); n.delete(dishId); return n; });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{t("menuCategoryDish.assignDishes")}</DialogTitle>
            <DialogDescription>
              {categoryName
                ? `${categoryName} — ${t("menuCategoryDish.assignDishesDesc")}`
                : t("menuCategoryDish.assignDishesDesc")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t("dish.loading")}</span>
            </div>
          ) : dishes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 border-2 border-dashed rounded-xl text-muted-foreground">
              <UtensilsCrossed className="h-7 w-7 opacity-30" />
              <p className="text-sm">{t("dish.empty")}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {dishes.map((dish) => {
                const dishName = dish.locales?.[0]?.name ?? dish.code;
                const isAssigned = assignedIds.has(dish.id);
                const isPending = pendingIds.has(dish.id);
                return (
                  <div
                    key={dish.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      isAssigned ? "bg-primary/5 border-primary/20" : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {dish.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{dishName}</p>
                      <p className="text-xs text-muted-foreground font-mono leading-tight">{dish.code}</p>
                    </div>
                    {isAssigned && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                        {t("dish.assigned")}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={isAssigned ? "outline" : "default"}
                      className="h-7 text-xs px-2.5 shrink-0"
                      disabled={isPending}
                      onClick={() =>
                        isAssigned
                          ? setConfirmTarget({ dishId: dish.id, dishName, action: "unassign" })
                          : setConfirmTarget({ dishId: dish.id, dishName, action: "assign" })
                      }
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isAssigned ? (
                        t("menuCategoryDish.unassign")
                      ) : (
                        t("menuCategoryDish.assign")
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmTarget?.action === "assign" ? t("dish.assignConfirmTitle") : t("dish.unassignConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmTarget?.action === "assign" ? t("dish.assignConfirmDesc") : t("dish.unassignConfirmDesc")}
                {confirmTarget && <span className="block font-medium mt-1">{confirmTarget.dishName}</span>}
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
