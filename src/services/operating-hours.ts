import { api } from "./api";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface OperatingSlot {
  id: number;
  day_of_week: DayOfWeek;
  sequence_no: number;
  open_time: string;
  close_time: string;
  label?: string;
  closes_next_day: boolean;
  is_closed: boolean;
}

export interface ClosingDay {
  id: number;
  day_of_week: DayOfWeek;
  note?: string;
}

export interface ScheduleResponse {
  operating: Partial<Record<DayOfWeek, OperatingSlot[]>>;
  closing: ClosingDay[];
}

export interface OperatingSlotRequest {
  day_of_week: DayOfWeek;
  sequence_no: number;
  open_time: string;
  close_time: string;
  label?: string;
  closes_next_day?: boolean;
  is_closed?: boolean;
}

export interface ClosingDayRequest {
  day_of_week: DayOfWeek;
  note?: string;
}

export interface ScheduleRequest {
  operating: OperatingSlotRequest[];
  closing: ClosingDayRequest[];
}

export const operatingHoursService = {
  async getSchedule(): Promise<ScheduleResponse> {
    return api.get<ScheduleResponse>("/restaurant-operating-hours/schedule");
  },

  async createSchedule(body: ScheduleRequest): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>("/restaurant-operating-hours/schedule", body);
  },

  async updateSchedule(body: ScheduleRequest): Promise<{ success: boolean }> {
    return api.put<{ success: boolean }>("/restaurant-operating-hours/schedule", body);
  },
};
