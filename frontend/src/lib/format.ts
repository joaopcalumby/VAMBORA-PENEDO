export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatMinutesUntil(minutes: number): string {
  if (minutes < 0) return "agora";
  if (minutes === 0) return "agora";
  if (minutes < 60) return `em ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `em ${h}h` : `em ${h}h${m}`;
}

export const MODAL_LABEL: Record<string, string> = {
  bus: "Ônibus",
  van: "Van",
  ferry: "Balsa",
};
