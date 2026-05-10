import { Eye, Layers, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ItemCategory } from "@/services/item-categories";

export interface ItemCategoryCardProps {
  category: ItemCategory;
  defaultName?: string;
  parentCode?: string;
  subCount?: number;
  onOverview?: (cat: ItemCategory) => void;
  onView?: (cat: ItemCategory) => void;
  onEdit?: (cat: ItemCategory) => void;
  onDelete?: (cat: ItemCategory) => void;
}

export function ItemCategoryCard({
  category,
  defaultName,
  parentCode,
  subCount,
  onOverview,
  onView,
  onEdit,
  onDelete,
}: ItemCategoryCardProps) {
  const { t } = useTranslation();
  const cat = category;

  const title = defaultName?.trim() || cat.code;
  const subtitle = defaultName?.trim() ? `${cat.code} · ID #${cat.id}` : `ID #${cat.id}`;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      <button
        type="button"
        className="flex flex-col gap-4 text-left w-full cursor-pointer"
        onClick={() => onOverview?.(cat)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
              {cat.code.slice(0, 4)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{title}</h3>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">#{cat.sort_order}</Badge>
        </div>

        <div className="text-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("itemCategory.parent")}</p>
            <p className="font-medium">{parentCode ?? t("itemCategory.noParent")}</p>
          </div>
          {subCount !== undefined && subCount > 0 && (
            <Badge variant="outline" className="text-xs">{subCount} {t("itemCategory.subs")}</Badge>
          )}
        </div>
      </button>

      {(onOverview || onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onOverview && (
            <Button variant="ghost" size="icon" aria-label="Overview" onClick={() => onOverview(cat)}>
              <Layers className="h-4 w-4" />
            </Button>
          )}
          {onView && (
            <Button variant="ghost" size="icon" aria-label={t("common.view")} onClick={() => onView(cat)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => onEdit(cat)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              onClick={() => onDelete(cat)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
