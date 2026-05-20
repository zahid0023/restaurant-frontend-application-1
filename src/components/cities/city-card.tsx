"use client";

import { Eye, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { City } from "@/services/cities";

export interface CityCardProps {
  city: City;
  defaultName?: string;
  onView?: (city: City) => void;
  onDelete?: (city: City) => void;
}

export function CityCard({ city, defaultName, onView, onDelete }: CityCardProps) {
  const title = defaultName?.trim() || city.code || `City #${city.id}`;
  const subtitle = defaultName?.trim()
    ? `${city.code ?? "—"} · ID #${city.id}`
    : `ID #${city.id}`;

  const handleAction = (e: React.MouseEvent, handler?: (c: City) => void) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(city);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(city)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(city); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            {city.code ?? "—"}
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
          <p className="text-xs text-muted-foreground">Code</p>
          <p className="font-medium">{city.code ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Country ID</p>
          <p className="font-medium">{city.country_id}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{city.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{city.locales.length} locale{city.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
