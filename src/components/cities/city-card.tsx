import { Pencil, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { City } from "@/services/cities";

export interface CityCardProps {
  city: City;
  defaultName?: string;
  countryLabel?: string;
  onView?: (city: City) => void;
  onEdit?: (city: City) => void;
  onDelete?: (city: City) => void;
}

export function CityCard({ city, defaultName, countryLabel, onView, onEdit, onDelete }: CityCardProps) {
  const { t } = useTranslation();

  const title = defaultName?.trim() || city.code || `City #${city.id}`;
  const subtitle = defaultName?.trim()
    ? `${city.code ? city.code + " · " : ""}ID #${city.id}`
    : `ID #${city.id}`;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-sm">
            {city.code?.slice(0, 3) ?? "?"}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">#{city.sort_order}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t("field.country")}</p>
          <p className="font-medium">{countryLabel ?? `#${city.country_id}`}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("common.code")}</p>
          <p className="font-medium">{city.code ?? "—"}</p>
        </div>
      </div>

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label="View" onClick={() => onView(city)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(city)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => onDelete(city)}
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
