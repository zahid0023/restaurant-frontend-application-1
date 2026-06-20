"use client";

import { Eye, Trash2, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { MenuCategory } from "@/services/menu-categories";

export interface MenuCategoryCardProps {
  category: MenuCategory;
  defaultName?: string;
  onView?: (c: MenuCategory) => void;
  onDelete?: (c: MenuCategory) => void;
  onAssignDishes?: (c: MenuCategory) => void;
}

export function MenuCategoryCard({ category, defaultName, onView, onDelete, onAssignDishes }: MenuCategoryCardProps) {
  const { t } = useTranslation();
  const c = category;

  const title = defaultName?.trim() || c.code;
  const subtitle = defaultName?.trim() ? `${c.code} · ID #${c.id}` : `ID #${c.id}`;

  const handleAction = (e: React.MouseEvent, handler?: (i: MenuCategory) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(c);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(c)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(c); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {c.code.slice(0, 4)}
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

      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("common.code")}</p>
          <p className="font-medium font-mono">{c.code}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("field.sort")}</p>
          <p className="font-medium">{c.sort_order}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{c.sort_order}</Badge>
          {onAssignDishes && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => handleAction(e, onAssignDishes)}
            >
              <UtensilsCrossed className="h-3 w-3" />
              {t("menuCategoryDish.assignDishes")}
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {c.locales?.length ?? 0} locale{(c.locales?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
