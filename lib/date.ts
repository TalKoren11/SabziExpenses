/** Convert a Date or ISO timestamp to a YYYY-MM-DD string (for <input type="date">). */
export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/** Today's date as YYYY-MM-DD. */
export function todayDateInputValue(): string {
  return toDateInputValue(new Date());
}

/** Format a YYYY-MM-DD string as dd.mm.yyyy. */
export function formatDateDDMMYYYY(value: string): string {
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}
