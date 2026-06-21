"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAY_LABELS, emptySlot, type DayForm, type DayOfWeek, type SlotForm } from "./types";

interface DayScheduleCardProps {
  day: DayOfWeek;
  value: DayForm;
  editing: boolean;
  onChange: (value: DayForm) => void;
}

export function DayScheduleCard({ day, value, editing, onChange }: DayScheduleCardProps) {
  const label = DAY_LABELS[day];

  function setDayStatus(closed: boolean) {
    onChange({ ...value, closed });
  }

  function setNote(note: string) {
    onChange({ ...value, note });
  }

  function addSlot() {
    onChange({ ...value, slots: [...value.slots, emptySlot()] });
  }

  function updateSlot(index: number, patch: Partial<SlotForm>) {
    const slots = value.slots.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...value, slots });
  }

  function removeSlot(index: number) {
    onChange({ ...value, slots: value.slots.filter((_, i) => i !== index) });
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{label}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={!value.closed ? "default" : "outline"}
                onClick={() => setDayStatus(false)}
              >
                Open
              </Button>
              <Button
                type="button"
                size="sm"
                variant={value.closed ? "destructive" : "outline"}
                onClick={() => setDayStatus(true)}
              >
                Closed
              </Button>
            </div>
          </div>

          {value.closed ? (
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={value.note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Weekly off"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {value.slots.length === 0 && (
                <p className="text-xs text-muted-foreground">No time slots — day will be treated as unscheduled.</p>
              )}
              {value.slots.map((slot, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Slot {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeSlot(i)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Open time</Label>
                      <Input
                        type="time"
                        value={slot.open_time}
                        onChange={(e) => updateSlot(i, { open_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Close time</Label>
                      <Input
                        type="time"
                        value={slot.close_time}
                        onChange={(e) => updateSlot(i, { close_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Label (optional)</Label>
                    <Input
                      value={slot.label}
                      onChange={(e) => updateSlot(i, { label: e.target.value })}
                      placeholder="e.g. Breakfast, Lunch, Dinner, Break"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={slot.closes_next_day}
                        disabled={slot.is_closed}
                        onChange={(e) => updateSlot(i, { closes_next_day: e.target.checked })}
                      />
                      Closes next day
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={slot.is_closed}
                        disabled={slot.closes_next_day}
                        onChange={(e) => updateSlot(i, { is_closed: e.target.checked })}
                      />
                      Break / closed period
                    </label>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" className="w-full" onClick={addSlot}>
                <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                Add slot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{label}</span>
          {value.closed ? (
            <Badge variant="destructive">Closed</Badge>
          ) : value.slots.length === 0 ? (
            <Badge variant="secondary">Unscheduled</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Open
            </Badge>
          )}
        </div>

        {value.closed ? (
          value.note ? (
            <p className="text-xs text-muted-foreground">{value.note}</p>
          ) : null
        ) : value.slots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No time slots configured.</p>
        ) : (
          <div className="space-y-1.5">
            {value.slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                <span className="font-mono text-xs">
                  {slot.open_time} – {slot.close_time}
                  {slot.closes_next_day && <span className="text-muted-foreground ml-1">(+1 day)</span>}
                </span>
                {slot.label && (
                  <Badge variant="outline" className="text-xs h-5 px-1.5">
                    {slot.label}
                  </Badge>
                )}
                {slot.is_closed && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    Break
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
