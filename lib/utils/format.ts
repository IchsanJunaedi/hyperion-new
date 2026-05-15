import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { id } from "date-fns/locale";

/** Format a Date / ISO string as `12 Mei 2026 · 20.00`. */
export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "d MMM yyyy · HH.mm", { locale: id });
}

/** Format as `Hari ini · 20.00` / `Besok · 20.00` / `12 Mei · 20.00`. */
export function formatScrimSchedule(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const time = format(d, "HH.mm", { locale: id });
  if (isToday(d)) return `Hari ini · ${time}`;
  if (isTomorrow(d)) return `Besok · ${time}`;
  return `${format(d, "d MMM", { locale: id })} · ${time}`;
}

/** "5 menit lalu", "2 jam lalu", etc. */
export function formatRelative(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

/** Normalize an Indonesian phone number to international (no `+`) for Fonnte. */
export function normalizeWaNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}
