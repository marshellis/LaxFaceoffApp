import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DelayRange, PracticeType } from '../../../src/practice/types';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { Colors } from '../../../src/theme/colors';

// ── Drill display names (from legacy PRACTICE_TYPE_CONFIGS) ──────────────────
const DRILL_NAMES: Record<PracticeType, string> = {
  downSetWhistle: 'Down Set Whistle',
  rapidClamp: 'Rapid Clamp',
  threeWhistle: 'Three Whistle Drill',
};

// ── RepsEditor ────────────────────────────────────────────────────────────────
interface RepsEditorProps {
  value: number;
  onChange: (v: number) => void;
  testID: string;
}

function RepsEditor({ value, onChange, testID }: RepsEditorProps) {
  return (
    <View style={styles.repsContainer}>
      <Text style={styles.fieldLabel}>Number of Reps</Text>
      <Text style={styles.numericLabel}>{value}</Text>
      <Slider
        testID={testID}
        style={styles.slider}
        minimumValue={1}
        maximumValue={20}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.backgroundSecondary}
        thumbTintColor={Colors.accent}
      />
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndLabel}>1</Text>
        <Text style={styles.sliderEndLabel}>20</Text>
      </View>
    </View>
  );
}

// ── RangeEditor ───────────────────────────────────────────────────────────────
interface RangeEditorProps {
  label: string;
  range: DelayRange;
  onChange: (r: DelayRange) => void;
  testID: string;
}

function RangeEditor({ label, range, onChange, testID }: RangeEditorProps) {
  const round1 = (n: number) => Math.round(n * 10) / 10;

  const handleMinChange = (v: number) => {
    const newMin = round1(v);
    onChange({ min: newMin, max: Math.max(newMin, range.max) });
  };

  const handleMaxChange = (v: number) => {
    const newMax = round1(v);
    onChange({ min: Math.min(range.min, newMax), max: newMax });
  };

  return (
    <View style={styles.rangeContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.numericLabel}>
        {range.min.toFixed(1)} – {range.max.toFixed(1)} s
      </Text>

      <Text style={styles.subLabel}>Min</Text>
      <Slider
        testID={`${testID}-min`}
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={range.min}
        onValueChange={handleMinChange}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.backgroundSecondary}
        thumbTintColor={Colors.accent}
      />

      <Text style={styles.subLabel}>Max</Text>
      <Slider
        testID={`${testID}-max`}
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.1}
        value={range.max}
        onValueChange={handleMaxChange}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.backgroundSecondary}
        thumbTintColor={Colors.accent}
      />
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndLabel}>0 s</Text>
        <Text style={styles.sliderEndLabel}>10 s</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PracticeTypesScreen() {
  const router = useRouter();
  const configs = useSettingsStore((s) => s.configs);
  const updateConfig = useSettingsStore((s) => s.updateConfig);

  const downSetWhistle = configs.downSetWhistle;
  const rapidClamp = configs.rapidClamp;
  const threeWhistle = configs.threeWhistle;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'‹ Settings'}</Text>
          </Pressable>
          <Text style={styles.title}>Practice Timing</Text>
        </View>

        <View testID="settings-practice-types-screen" style={styles.sectionsWrapper}>
          {/* ── Down Set Whistle ─────────────────────────────────────────── */}
          <View style={styles.drillSection}>
            <Text style={styles.drillTitle}>{DRILL_NAMES.downSetWhistle}</Text>

            <RepsEditor
              testID="reps-downSetWhistle"
              value={downSetWhistle.numberOfReps}
              onChange={(v) => updateConfig('downSetWhistle', { numberOfReps: v })}
            />

            <RangeEditor
              testID="range-downSetWhistle-downToSet"
              label="Down to Set (seconds)"
              range={downSetWhistle.downToSet ?? { min: 0.5, max: 2.0 }}
              onChange={(r) => updateConfig('downSetWhistle', { downToSet: r })}
            />

            <RangeEditor
              testID="range-downSetWhistle-setToWhistle"
              label="Set to Whistle (seconds)"
              range={downSetWhistle.setToWhistle ?? { min: 0.3, max: 1.5 }}
              onChange={(r) => updateConfig('downSetWhistle', { setToWhistle: r })}
            />

            <RangeEditor
              testID="range-downSetWhistle-restBetween"
              label="Rest Between Reps (seconds)"
              range={downSetWhistle.restBetween ?? { min: 2.0, max: 4.0 }}
              onChange={(r) => updateConfig('downSetWhistle', { restBetween: r })}
            />
          </View>

          {/* ── Rapid Clamp ──────────────────────────────────────────────── */}
          <View style={styles.drillSection}>
            <Text style={styles.drillTitle}>{DRILL_NAMES.rapidClamp}</Text>

            <RepsEditor
              testID="reps-rapidClamp"
              value={rapidClamp.numberOfReps}
              onChange={(v) => updateConfig('rapidClamp', { numberOfReps: v })}
            />

            <RangeEditor
              testID="range-rapidClamp-restBetween"
              label="Rest Between Reps (seconds)"
              range={rapidClamp.restBetween ?? { min: 1.0, max: 3.0 }}
              onChange={(r) => updateConfig('rapidClamp', { restBetween: r })}
            />
          </View>

          {/* ── Three Whistle Drill ──────────────────────────────────────── */}
          <View style={styles.drillSection}>
            <Text style={styles.drillTitle}>{DRILL_NAMES.threeWhistle}</Text>

            <RepsEditor
              testID="reps-threeWhistle"
              value={threeWhistle.numberOfReps}
              onChange={(v) => updateConfig('threeWhistle', { numberOfReps: v })}
            />

            <RangeEditor
              testID="range-threeWhistle-clampToPull"
              label="Clamp to Pull (seconds)"
              range={threeWhistle.clampToPull ?? { min: 0.3, max: 1.0 }}
              onChange={(r) => updateConfig('threeWhistle', { clampToPull: r })}
            />

            <RangeEditor
              testID="range-threeWhistle-pullToPop"
              label="Pull to Pop (seconds)"
              range={threeWhistle.pullToPop ?? { min: 0.3, max: 1.0 }}
              onChange={(r) => updateConfig('threeWhistle', { pullToPop: r })}
            />

            <RangeEditor
              testID="range-threeWhistle-resetPause"
              label="Reset Pause (seconds)"
              range={threeWhistle.resetPause ?? { min: 3.0, max: 5.0 }}
              onChange={(r) => updateConfig('threeWhistle', { resetPause: r })}
            />

            <RangeEditor
              testID="range-threeWhistle-restBetween"
              label="Rest Between Reps (seconds)"
              range={threeWhistle.restBetween ?? { min: 2.0, max: 4.0 }}
              onChange={(r) => updateConfig('threeWhistle', { restBetween: r })}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  backButton: {
    marginBottom: 4,
  },
  backText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionsWrapper: {
    paddingBottom: 40,
  },
  drillSection: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundSecondary,
  },
  drillTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  repsContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rangeContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  numericLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderEndLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
