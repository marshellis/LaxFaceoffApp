import { type PracticeSession, summarizeHistory } from './historyStats';

// Helper: create a timestamp N days before `now`
function daysAgo(now: number, n: number): number {
  return now - n * 24 * 60 * 60 * 1000;
}

// A fixed reference point so tests are deterministic
// 2025-01-15T12:00:00Z
const NOW = new Date('2025-01-15T12:00:00Z').getTime();

describe('summarizeHistory', () => {
  it('returns zeros for empty session list', () => {
    const result = summarizeHistory([], NOW);
    expect(result.total).toBe(0);
    expect(result.totalReps).toBe(0);
    expect(result.byDay).toEqual({});
    expect(result.currentStreakDays).toBe(0);
  });

  it('counts total sessions and totalReps correctly', () => {
    const sessions: PracticeSession[] = [
      { type: 'downSetWhistle', reps: 5, durationSec: 60, timestamp: daysAgo(NOW, 1) },
      { type: 'rapidClamp', reps: 10, durationSec: 90, timestamp: daysAgo(NOW, 1) },
      { type: 'threeWhistle', reps: 3, durationSec: 45, timestamp: daysAgo(NOW, 3) },
    ];
    const result = summarizeHistory(sessions, NOW);
    expect(result.total).toBe(3);
    expect(result.totalReps).toBe(18);
  });

  it('groups sessions by day (YYYY-MM-DD) in byDay', () => {
    const sessions: PracticeSession[] = [
      { type: 'downSetWhistle', reps: 5, durationSec: 60, timestamp: daysAgo(NOW, 1) },
      { type: 'rapidClamp', reps: 10, durationSec: 90, timestamp: daysAgo(NOW, 1) },
      { type: 'threeWhistle', reps: 3, durationSec: 45, timestamp: daysAgo(NOW, 3) },
    ];
    const result = summarizeHistory(sessions, NOW);
    // 2025-01-14 is 1 day ago from 2025-01-15
    expect(result.byDay['2025-01-14']).toBe(2);
    // 2025-01-12 is 3 days ago
    expect(result.byDay['2025-01-12']).toBe(1);
  });

  it('computes currentStreakDays=3 for 3 consecutive days ending today', () => {
    const sessions: PracticeSession[] = [
      { type: 'downSetWhistle', reps: 5, durationSec: 60, timestamp: NOW }, // today
      { type: 'rapidClamp', reps: 10, durationSec: 90, timestamp: daysAgo(NOW, 1) }, // yesterday
      { type: 'threeWhistle', reps: 3, durationSec: 45, timestamp: daysAgo(NOW, 2) }, // 2 days ago
    ];
    const result = summarizeHistory(sessions, NOW);
    expect(result.currentStreakDays).toBe(3);
  });

  it('streak breaks when there is a gap', () => {
    const sessions: PracticeSession[] = [
      { type: 'downSetWhistle', reps: 5, durationSec: 60, timestamp: NOW }, // today
      // gap: yesterday missing
      { type: 'threeWhistle', reps: 3, durationSec: 45, timestamp: daysAgo(NOW, 2) }, // 2 days ago
    ];
    const result = summarizeHistory(sessions, NOW);
    expect(result.currentStreakDays).toBe(1);
  });

  it('streak is 0 when most recent session is not today', () => {
    const sessions: PracticeSession[] = [
      { type: 'downSetWhistle', reps: 5, durationSec: 60, timestamp: daysAgo(NOW, 1) },
      { type: 'rapidClamp', reps: 10, durationSec: 90, timestamp: daysAgo(NOW, 2) },
    ];
    const result = summarizeHistory(sessions, NOW);
    expect(result.currentStreakDays).toBe(0);
  });

  it('uses Date.now() when no now param provided (smoke test — just check it runs)', () => {
    const result = summarizeHistory([]);
    expect(result.total).toBe(0);
  });
});

import { dailySeries } from './historyStats';

describe('dailySeries', () => {
  // 2025-01-15 noon UTC
  const NOW = new Date('2025-01-15T12:00:00Z').getTime();

  it('returns exactly `days` entries', () => {
    const series = dailySeries({}, 14, NOW);
    expect(series).toHaveLength(14);
  });

  it('last element is today (YYYY-MM-DD in local time)', () => {
    const series = dailySeries({}, 14, NOW);
    const last = series[series.length - 1];
    // Build today's local key the same way toDateKey does
    const d = new Date(NOW);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const todayKey = `${yyyy}-${mm}-${dd}`;
    expect(last.date).toBe(todayKey);
  });

  it('is oldest-first (ascending date order)', () => {
    const series = dailySeries({}, 7, NOW);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].date > series[i - 1].date).toBe(true);
    }
  });

  it('maps counts from byDay; missing days get 0', () => {
    const byDay: Record<string, number> = {
      '2025-01-15': 3, // today
      '2025-01-13': 1, // 2 days ago
    };
    const series = dailySeries(byDay, 14, NOW);

    const todayEntry = series.find((b) => b.date === '2025-01-15');
    const jan13Entry = series.find((b) => b.date === '2025-01-13');
    const jan11Entry = series.find((b) => b.date === '2025-01-11');

    expect(todayEntry?.count).toBe(3);
    expect(jan13Entry?.count).toBe(1);
    expect(jan11Entry?.count).toBe(0);
  });

  it('count is 0 for all buckets when byDay is empty', () => {
    const series = dailySeries({}, 5, NOW);
    expect(series.every((b) => b.count === 0)).toBe(true);
  });

  it('works with days=1, returning only today', () => {
    const series = dailySeries({ '2025-01-15': 2 }, 1, NOW);
    expect(series).toHaveLength(1);
    expect(series[0].count).toBe(2);
  });

  it('defaults now to Date.now() (smoke test)', () => {
    const series = dailySeries({}, 3);
    expect(series).toHaveLength(3);
  });
});
