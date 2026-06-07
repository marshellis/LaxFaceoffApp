import type { PracticeType } from '../practice/types';

export interface PracticeSession {
  type: PracticeType;
  reps: number;
  durationSec: number;
  timestamp: number; // Unix ms
}

export interface HistorySummary {
  total: number;
  totalReps: number;
  /** Session count per calendar day, keyed by YYYY-MM-DD. */
  byDay: Record<string, number>;
  /** Number of consecutive days up to (and including) today that have >= 1 session. */
  currentStreakDays: number;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Last `days` days ending at `now` (oldest first), each with its session count from byDay.
 * Days with no entry in byDay receive count 0.
 *
 * @param byDay - Map of YYYY-MM-DD to session count (from summarizeHistory).
 * @param days  - Number of days to include (including today).
 * @param now   - Optional reference timestamp (Unix ms). Defaults to Date.now().
 */
export function dailySeries(
  byDay: Record<string, number>,
  days: number,
  now: number = Date.now(),
): DayBucket[] {
  // Anchor to start of today in local time so arithmetic stays in whole days.
  const anchor = new Date(now);
  anchor.setHours(0, 0, 0, 0);

  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor.getTime() - i * 24 * 60 * 60 * 1000);
    const key = toDateKey(d.getTime());
    buckets.push({ date: key, count: byDay[key] ?? 0 });
  }
  return buckets;
}

/** Format a Unix-ms timestamp to YYYY-MM-DD in local time. */
function toDateKey(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Pure aggregation over a flat list of sessions.
 *
 * @param sessions - All recorded sessions.
 * @param now      - Optional reference timestamp (Unix ms). Defaults to Date.now().
 *                   Useful for deterministic tests.
 */
export function summarizeHistory(
  sessions: PracticeSession[],
  now: number = Date.now(),
): HistorySummary {
  const byDay: Record<string, number> = {};
  let totalReps = 0;

  for (const s of sessions) {
    totalReps += s.reps;
    const key = toDateKey(s.timestamp);
    byDay[key] = (byDay[key] ?? 0) + 1;
  }

  // Streak: walk backward from today, counting consecutive days with sessions.
  let streakDays = 0;
  const cursor = new Date(now);
  // Normalise cursor to start of local day so arithmetic is exact.
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = toDateKey(cursor.getTime());
    if (!byDay[key]) break;
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
    // Safety: never count further back than the number of distinct days we have
    if (streakDays > Object.keys(byDay).length) break;
  }

  return {
    total: sessions.length,
    totalReps,
    byDay,
    currentStreakDays: streakDays,
  };
}
