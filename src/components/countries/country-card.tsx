import { Pencil, Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Country } from "@/services/countries";

export interface CountryCardProps {
  country: Country;
  defaultName?: string;
  onView?: (country: Country) => void;
  onEdit?: (country: Country) => void;
  onDelete?: (country: Country) => void;
}

export function CountryCard({ country, defaultName, onView, onEdit, onDelete }: CountryCardProps) {
  const title = defaultName?.trim() || country.iso3_code || country.code;
  const subtitle = defaultName?.trim()
    ? `${country.iso3_code ?? country.code} · ID #${country.id}`
    : `ID #${country.id}`;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            {country.code}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">#{country.sort_order}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">ISO3</p>
          <p className="font-medium">{country.iso3_code ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="font-medium">{country.phone_code ?? "—"}</p>
        </div>
      </div>

      {(onView || onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1 pt-2 border-t -mx-5 px-5 -mb-5 pb-3">
          {onView && (
            <Button variant="ghost" size="icon" aria-label="View" onClick={() => onView(country)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(country)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => onDelete(country)}
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
