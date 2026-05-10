import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ItemType } from "@/services/item-types";

export interface ItemTypeCardProps {
  itemType: ItemType;
  defaultName?: string;
  href?: string;
  onView?: (it: ItemType) => void;
  onEdit?: (it: ItemType) => void;
  onDelete?: (it: ItemType) => void;
}

export function ItemTypeCard({ itemType, defaultName, href, onView, onEdit, onDelete }: ItemTypeCardProps) {
  const { t } = useTranslation();
  const it = itemType;

  const title = defaultName?.trim() || it.code;
  const subtitle = defaultName?.trim() ? `${it.code} · ID #${it.id}` : `ID #${it.id}`;

  const body = (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
          {it.code.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant="secondary">#{it.sort_order}</Badge>
        <Badge variant={it.is_consumable ? "default" : "outline"} className="text-xs">
          {it.is_consumable ? t("itemType.consumable") : t("itemType.nonConsumable")}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {href ? <Link href={href} className="block">{body}</Link> : body}

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label={t("common.view")} onClick={() => onView(it)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => onEdit(it)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              onClick={() => onDelete(it)}
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
