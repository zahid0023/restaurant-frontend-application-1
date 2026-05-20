"use client";

import { Eye, Trash2 } from "lucide-react";
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

  const handleAction = (e: React.MouseEvent, handler?: (c: ItemCategory) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(cat);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOverview?.(cat)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOverview?.(cat); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {(onView ?? onOverview) && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => handleAction(e, onView ?? onOverview)}>
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

      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("itemCategory.parent")}</p>
          <p className="font-medium">{parentCode ?? t("itemCategory.noParent")}</p>
        </div>
        {subCount !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">{t("itemCategory.subs")}</p>
            <p className="font-medium">{subCount}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{cat.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{cat.locales.length} locale{cat.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
