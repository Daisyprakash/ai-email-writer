export function getTodayDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getNextDailyResetTime(date = new Date()): Date {
  const reset = new Date(date);
  reset.setUTCHours(24, 0, 0, 0);
  return reset;
}
