export function getTargetDate(
  start_date: string,
  start_time: string | null
): Date {
  const timeStr = start_time ?? "00:00:00";
  return new Date(`${start_date}T${timeStr}`);
}

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function computeTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}
