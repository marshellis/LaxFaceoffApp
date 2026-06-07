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
