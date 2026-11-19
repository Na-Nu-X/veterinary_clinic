import { OpeningHoursRow } from '../config/site.config';

export interface OpeningStatus {
  isOpen: boolean;
  label: string;
  todayIndex: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** Computes whether the clinic is open right now and a short Slovak label. */
export function getOpeningStatus(rows: OpeningHoursRow[], now: Date = new Date()): OpeningStatus {
  const weekday = isoWeekday(now);
  const todayIndex = rows.findIndex((r) => r.weekdays.includes(weekday));
  const today = rows[todayIndex];
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (today?.opens && today.closes) {
    const opens = toMinutes(today.opens);
    const closes = toMinutes(today.closes);
    if (minutes >= opens && minutes < closes) {
      return { isOpen: true, label: `Teraz otvorené · do ${today.closes}`, todayIndex };
    }
    if (minutes < opens) {
      return { isOpen: false, label: `Zatvorené · otvárame o ${today.opens}`, todayIndex };
    }
  }
  return { isOpen: false, label: 'Zatvorené · pohotovosť nonstop', todayIndex };
}
