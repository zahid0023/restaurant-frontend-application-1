import type { DayOfWeek } from "@/services/operating-hours";

export type { DayOfWeek };

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export interface SlotForm {
  open_time: string;
  close_time: string;
  label: string;
  closes_next_day: boolean;
  is_closed: boolean;
}

export interface DayForm {
  closed: boolean;
  note: string;
  slots: SlotForm[];
}

export type ScheduleForm = Record<DayOfWeek, DayForm>;

export function emptyDayForm(): DayForm {
  return { closed: false, note: "", slots: [] };
}

export function emptySlot(): SlotForm {
  return { open_time: "09:00", close_time: "22:00", label: "", closes_next_day: false, is_closed: false };
}
