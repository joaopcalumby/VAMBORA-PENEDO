// Tipos de resposta do backend usados nas telas do frontend.

export type LineSummary = {
  id: number;
  number: string;
  name: string;
  modal: string;
  default_price_cents: number;
};

export type NextDeparture = {
  departure_time: string;
  target_date: string;
  minutes_until: number;
  same_day: boolean;
};

export type SchedulesByDay = {
  weekday: string[];
  saturday: string[];
  sunday_holiday: string[];
};

export type StopSummary = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  modal: string;
};

export type FavoriteResponse = {
  id: number;
  target_type: "line" | "stop";
  target_id: number;
  created_at: string;
};

export type LineAtStop = {
  id: number;
  number: string;
  name: string;
  modal: string;
  next_departure: NextDeparture | null;
};

export type StopDetail = StopSummary & { lines: LineAtStop[] };
