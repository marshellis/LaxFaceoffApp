import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PracticeType } from '../../src/practice/types';
import { dailySeries, summarizeHistory } from '../../src/state/historyStats';
import { useHistoryStore } from '../../src/state/historyStore';
import { Colors } from '../../src/theme/colors';

// ─── Human-readable drill names ─────────────────────────────────────────────
const DRILL_NAMES: Record<PracticeType, string> = {
  downSetWhistle: 'Down Set Whistle',
  rapidClamp: 'Rapid Clamp',
  threeWhistle: 'Three Whistle Drill',
};

// ─── Tiny helper components ──────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  testID: string;
}

function StatCard({ label, value, testID }: StatCardProps) {
  return (
    <View style={styles.statCard} testID={testID}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface BarProps {
  count: number;
  maxCount: number;
  date: string;
  showLabel: boolean;
}

const BAR_MAX_H = 52;
const BAR_MIN_H = 4;

function Bar({ count, maxCount, date, showLabel }: BarProps) {
  const height =
    maxCount === 0 ? BAR_MIN_H : BAR_MIN_H + (count / maxCount) * (BAR_MAX_H - BAR_MIN_H);
  const isEmpty = count === 0;

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barTrack}>
        <View style={[styles.bar, { height }, isEmpty ? styles.barEmpty : styles.barFilled]} />
      </View>
      {showLabel && <Text style={styles.barLabel}>{date.slice(5)}</Text>}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function relativeDate(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const sessions = useHistoryStore((s) => s.sessions);
  const summary = summarizeHistory(sessions);
  const series = dailySeries(summary.byDay, 14);
  const maxCount = Math.max(...series.map((b) => b.count), 0);

  // Indices where we show the date label (first, middle, last of 14)
  const labelIndices = new Set([0, 6, 13]);

  const recent = [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  if (sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View testID="activity-screen" style={styles.emptyContainer}>
          <Text style={styles.screenTitle}>Activity</Text>
          <View testID="activity-empty" style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏃</Text>
            <Text style={styles.emptyHeading}>No practice yet</Text>
            <Text style={styles.emptyBody}>Go run a drill — your history will show up here!</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        testID="activity-screen"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Activity</Text>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard testID="stat-total" label="Sessions" value={summary.total} />
          <StatCard testID="stat-reps" label="Total Reps" value={summary.totalReps} />
          <StatCard testID="stat-streak" label="Day Streak" value={summary.currentStreakDays} />
        </View>

        {/* ── 14-day bar chart ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 14 Days</Text>
          <View testID="activity-chart" style={styles.chart}>
            {series.map((bucket, i) => (
              <Bar
                key={bucket.date}
                count={bucket.count}
                maxCount={maxCount}
                date={bucket.date}
                showLabel={labelIndices.has(i)}
              />
            ))}
          </View>
        </View>

        {/* ── Recent sessions ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <View testID="recent-sessions">
            {recent.map((s, idx) => (
              <View
                key={String(s.timestamp)}
                style={[styles.sessionRow, idx < recent.length - 1 && styles.sessionRowBorder]}
              >
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionDrill}>{DRILL_NAMES[s.type] ?? s.type}</Text>
                  <Text style={styles.sessionMeta}>
                    {s.reps} reps · {fmtDuration(s.durationSec)}
                  </Text>
                </View>
                <Text style={styles.sessionDate}>{relativeDate(s.timestamp)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 20,
  },
  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  // Bar chart
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 8,
    height: 100,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    justifyContent: 'flex-end',
    height: BAR_MAX_H,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barFilled: {
    backgroundColor: Colors.accent,
  },
  barEmpty: {
    backgroundColor: '#DDDDDD',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Recent sessions
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sessionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.backgroundSecondary,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionDrill: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sessionMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 12,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
