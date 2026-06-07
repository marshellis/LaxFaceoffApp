import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/Colors';

export default function SegmentedControl({ 
  segments, 
  selectedIndex, 
  onChange,
  style 
}) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.segment,
              isSelected && styles.selectedSegment,
              index === 0 && styles.firstSegment,
              index === segments.length - 1 && styles.lastSegment,
            ]}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              isSelected && styles.selectedSegmentText
            ]}>
              {segment}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.backgroundSecondary,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  selectedSegment: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  firstSegment: {
    // No additional styles needed due to flex layout
  },
  lastSegment: {
    // No additional styles needed due to flex layout
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedSegmentText: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
});

