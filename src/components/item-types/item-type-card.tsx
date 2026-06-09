"use client";

import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { ItemType } from "@/services/item-types";

export interface ItemTypeCardProps {
  itemType: ItemType;
  defaultName?: string;
  onView?: (it: ItemType) => void;
  onDelete?: (it: ItemType) => void;
}

export function ItemTypeCard({ itemType, defaultName, onView, onDelete }: ItemTypeCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const title = defaultName?.trim() || itemType.code;
  const subtitle = defaultName?.trim() ? `${itemType.code} · ID #${itemType.id}` : `ID #${itemType.id}`;

  const goToDetail = () => router.push(`/item-types/${itemType.id}`);

  const handleAction = (e: React.MouseEvent, handler?: (i: ItemType) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(itemType);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToDetail(); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs text-center leading-tight px-1">
            {itemType.code.slice(0, 4)}
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

      <div className="mt-4 text-sm">
        <p className="text-xs text-muted-foreground">{t("itemType.isConsumable")}</p>
        <p className="font-medium">{itemType.is_consumable ? t("itemType.consumable") : t("itemType.nonConsumable")}</p>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{itemType.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{itemType.locales.length} locale{itemType.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
