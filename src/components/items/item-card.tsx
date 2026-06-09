"use client";

import { Eye, Trash2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ItemSummary } from "@/services/items";

export interface ItemCardProps {
  item: ItemSummary;
  defaultName?: string;
  onView?: (item: ItemSummary) => void;
  onDelete?: (item: ItemSummary) => void;
  onAssignCategories?: (item: ItemSummary) => void;
  onUnassignCategory?: (item: ItemSummary) => void;
}

export function ItemCard({ item, defaultName, onView, onDelete, onAssignCategories, onUnassignCategory }: ItemCardProps) {
  const { t } = useTranslation();

  const title = defaultName?.trim() || item.code;
  const subtitle = defaultName?.trim() ? `${item.code} · ID #${item.id}` : `ID #${item.id}`;

  const handleAction = (e: React.MouseEvent, handler?: (i: ItemSummary) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(item);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(item); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {item.code.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleAction(e, onView)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleAction(e, onDelete)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{item.sort_order}</Badge>
          {item.unit_type && (
            <Badge variant="outline" className="text-xs font-mono">
              {item.unit_type.code}
            </Badge>
          )}
          {onAssignCategories && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => handleAction(e, onAssignCategories)}
            >
              <Tag className="h-3 w-3" />
              {t("shopItem.assignCategories")}
            </Button>
          )}
          {onUnassignCategory && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => handleAction(e, onUnassignCategory)}
            >
              <Tag className="h-3 w-3" />
              {t("shopItem.unassignFromCategory")}
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {item.locales.length} {item.locales.length !== 1 ? t("shopItem.locales") : t("shopItem.locale")}
        </span>
      </div>
    </Card>
  );
}
