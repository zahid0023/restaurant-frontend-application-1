import { Eye, Pencil, Trash2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { Item } from "@/services/items";

export interface ItemCardProps {
  item: Item;
  defaultName?: string;
  onView?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onAssignCategories?: (item: Item) => void;
}

export function ItemCard({ item, defaultName, onView, onEdit, onDelete, onAssignCategories }: ItemCardProps) {
  const { t } = useTranslation();

  const title = defaultName?.trim() || item.code || `#${item.id}`;
  const subtitle = [
    item.code?.trim() ? item.code : null,
    `ID #${item.id}`,
    `Unit #${item.unit_id}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const initials = (item.code ?? String(item.id)).slice(0, 4).toUpperCase();

  const body = (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0">#{item.sort_order}</Badge>
    </div>
  );

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {body}

      {(onView || onEdit || onDelete || onAssignCategories) && (
        <div className="flex items-center justify-between gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onAssignCategories && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => onAssignCategories(item)}
            >
              <Tag className="h-3.5 w-3.5" />
              {t("shopItem.assignCategories")}
            </Button>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {onView && (
              <Button variant="ghost" size="icon" aria-label={t("common.view")} onClick={() => onView(item)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => onEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("common.delete")}
                onClick={() => onDelete(item)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
