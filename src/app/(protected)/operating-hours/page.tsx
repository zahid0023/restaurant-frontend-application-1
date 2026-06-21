"use client";

import { useEffect, useRef, useState } from "react";
import { ClockIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DayScheduleCard } from "@/components/operating-hours/day-schedule-card";
import {
  DAYS_OF_WEEK,
  emptyDayForm,
  emptySlot,
  type DayForm,
  type DayOfWeek,
  type ScheduleForm,
} from "@/components/operating-hours/types";
import {
  operatingHoursService,
  type ScheduleResponse,
  type ScheduleRequest,
} from "@/services/operating-hours";

function responseToForm(res: ScheduleResponse): ScheduleForm {
  const form = {} as ScheduleForm;
  for (const day of DAYS_OF_WEEK) {
    const closingEntry = res.closing.find((c) => c.day_of_week === day);
    if (closingEntry) {
      form[day] = { closed: true, note: closingEntry.note ?? "", slots: [] };
    } else {
      const slots = (res.operating[day] ?? []).map((s) => ({
        open_time: s.open_time,
        close_time: s.close_time,
        label: s.label ?? "",
        closes_next_day: s.closes_next_day,
        is_closed: s.is_closed,
      }));
      form[day] = { closed: false, note: "", slots };
    }
  }
  return form;
}

function formToRequest(form: ScheduleForm): ScheduleRequest {
  const closing: ScheduleRequest["closing"] = [];
  const operating: ScheduleRequest["operating"] = [];

  for (const day of DAYS_OF_WEEK) {
    const d = form[day];
    if (d.closed) {
      closing.push({ day_of_week: day, ...(d.note ? { note: d.note } : {}) });
    } else {
      d.slots.forEach((slot, i) => {
        operating.push({
          day_of_week: day,
          sequence_no: i + 1,
          open_time: slot.open_time,
          close_time: slot.close_time,
          ...(slot.label ? { label: slot.label } : {}),
          closes_next_day: slot.closes_next_day,
          is_closed: slot.is_closed,
        });
      });
    }
  }

  return { closing, operating };
}

function emptyForm(): ScheduleForm {
  const form = {} as ScheduleForm;
  for (const day of DAYS_OF_WEEK) {
    form[day] = emptyDayForm();
  }
  return form;
}

export default function OperatingHoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editForm, setEditForm] = useState<ScheduleForm>(emptyForm);
  const scheduleExists = useRef(false);

  async function load() {
    setLoading(true);
    try {
      const res = await operatingHoursService.getSchedule();
      scheduleExists.current = true;
      setForm(responseToForm(res));
    } catch {
      scheduleExists.current = false;
      setForm(emptyForm());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEdit() {
    setEditForm(structuredClone(form));
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = formToRequest(editForm);
      if (scheduleExists.current) {
        await operatingHoursService.updateSchedule(body);
      } else {
        await operatingHoursService.createSchedule(body);
        scheduleExists.current = true;
      }
      setForm(editForm);
      setEditing(false);
      toast.success("Schedule saved");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function updateDay(day: DayOfWeek, value: DayForm) {
    setEditForm((prev) => ({ ...prev, [day]: value }));
  }

  const displayForm = editing ? editForm : form;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight">Operating Hours</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set weekly opening times and closed days for your restaurant.
          </p>
        </div>
        {!loading && !editing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <ClockIcon className="h-4 w-4 mr-1.5" />
            Edit schedule
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => (
            <DayScheduleCard
              key={day}
              day={day}
              value={displayForm[day]}
              editing={editing}
              onChange={(value) => updateDay(day, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
