import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { menuCategoriesService, type MenuCategoryDish } from "@/services/menu-categories";
import { dishesService, type Dish } from "@/services/dishes";
import { toast } from "sonner";

interface MenuCategoryDishesProps {
  categoryId: number;
  open: boolean;
}

export function MenuCategoryDishes({ categoryId, open }: MenuCategoryDishesProps) {
  const { t } = useTranslation();
  const [assignedDishes, setAssignedDishes] = useState<MenuCategoryDish[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<MenuCategoryDish | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  useEffect(() => {
    if (!open) {
      setAssignedDishes([]);
      setAllDishes([]);
      setSelectedDishId("");
      setUnassignTarget(null);
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
        dishesService.list({ size: 200, sort_by: "sortOrder" }),
      ]);
      setAssignedDishes(catRes.menu_category.dishes ?? []);
      setAllDishes(dishesRes.data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const assignedIds = new Set(assignedDishes.map((d) => d.id));
  const availableToAssign = allDishes.filter((d) => !assignedIds.has(d.id));

  async function handleAssign() {
    if (!selectedDishId) return;
    setAssigning(true);
    try {
      await menuCategoriesService.assignDish(categoryId, Number(selectedDishId));
      toast.success(t("menuCategoryDish.assignedToast"));
      setSelectedDishId("");
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign() {
    if (!unassignTarget) return;
    setUnassigning(true);
    try {
      await menuCategoriesService.unassignDish(categoryId, unassignTarget.id);
      toast.success(t("menuCategoryDish.unassignedToast"));
      setUnassignTarget(null);
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUnassigning(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("menuCategoryDish.section")}
          </h3>
        </div>

        <Card className="gap-0 py-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t("menuCategoryDish.loading")}
            </div>
          ) : assignedDishes.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <UtensilsCrossed className="h-4 w-4 mr-2 opacity-40" />
              {t("menuCategoryDish.none")}
            </div>
          ) : (
            <div className="divide-y">
              {assignedDishes.map((dish) => (
                <div key={dish.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-mono font-medium text-primary">
                      {dish.code.slice(0, 4)}
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">{dish.code}</p>
                      {dish.locales?.[0]?.name && (
                        <p className="text-xs text-muted-foreground">{dish.locales[0].name}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setUnassignTarget(dish)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!loading && availableToAssign.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/20">
              <Select value={selectedDishId} onValueChange={setSelectedDishId}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue placeholder={t("menuCategoryDish.selectDish")} />
                </SelectTrigger>
                <SelectContent>
                  {availableToAssign.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.locales?.[0]?.name ? `${d.locales[0].name} (${d.code})` : d.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={handleAssign}
                disabled={!selectedDishId || assigning}
                className="h-9 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t("menuCategoryDish.assign")}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={!!unassignTarget} onOpenChange={(o) => !o && setUnassignTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("menuCategoryDish.unassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("menuCategoryDish.unassignDesc", { code: unassignTarget?.code ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassigning}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassign} disabled={unassigning}>
              {t("menuCategoryDish.unassign")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
