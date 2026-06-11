"use client";

import { Eye, Trash2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { Dish } from "@/services/dishes";

export interface DishCardProps {
  dish: Dish;
  defaultName?: string;
  onView?: (dish: Dish) => void;
  onDelete?: (dish: Dish) => void;
  onAssignCategories?: (dish: Dish) => void;
}

export function DishCard({ dish, defaultName, onView, onDelete, onAssignCategories }: DishCardProps) {
  const { t } = useTranslation();

  const title = defaultName?.trim() || dish.code;
  const subtitle = defaultName?.trim() ? `${dish.code} · ID #${dish.id}` : `ID #${dish.id}`;
  const localeCount = dish.locales?.length ?? 0;

  const handleAction = (e: React.MouseEvent, handler?: (d: Dish) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(dish);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(dish)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(dish); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {dish.code.slice(0, 4)}
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

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">#{dish.sort_order}</Badge>
          {dish.is_veg && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              {t("dish.veg")}
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
              {t("dish.assignCategories")}
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {localeCount} {localeCount !== 1 ? t("dish.locales") : t("dish.locale")}
        </span>
      </div>
    </Card>
  );
}
