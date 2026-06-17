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

export type TransactionResponse = {
  id: number;
  type: "recharge" | "payment";
  amount_cents: number;
  line_id: number | null;
  driver_user_id: number | null;
  qrcode_id: number | null;
  created_at: string;
};

export type WalletResponse = {
  balance_cents: number;
  last_transactions: TransactionResponse[];
};

export type PaymentPreviewResponse = {
  qrcode_id: number;
  driver_user_id: number;
  driver_name: string;
  line_id: number;
  line_number: string;
  line_name: string;
  amount_cents: number;
  user_category_slug: string;
};

export type PaymentConfirmResponse = {
  transaction_id: number;
  amount_cents: number;
  line_number: string;
  line_name: string;
  new_balance_cents: number;
  created_at: string;
};

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  role: string;
  has_driver: boolean;
  driver_status: string | null;
  fare_category_slug: string | null;
};

export type ReminderResponse = {
  id: number;
  line_id: number;
  stop_id: number;
  anticipation_minutes: number;
  active: boolean;
  created_at: string;
};

export type CategoryResponse = {
  id: number;
  slug: string;
  name: string;
  requires_document: boolean;
  is_default: boolean;
};

export type CategoryRequestResponse = {
  id: number;
  category_id: number;
  category_slug: string;
  category_name: string;
  status: "pending" | "approved" | "rejected";
  document_path: string | null;
  justification: string | null;
  created_at: string;
  reviewed_at: string | null;
};
