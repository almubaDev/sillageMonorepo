import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  maxStars?: number;
  showLabel?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 22,
  maxStars = 10,
  showLabel = true,
}) => {
  const { colors } = useTheme();
  const lastTapRef = useRef<{ star: number; time: number }>({ star: 0, time: 0 });
  const isEditable = !!onChange;

  const handlePress = (starIndex: number) => {
    if (!onChange) return;

    const now = Date.now();
    const last = lastTapRef.current;

    // Doble click en la misma estrella = estrella completa
    if (last.star === starIndex && now - last.time < 400) {
      const fullValue = starIndex;
      onChange(value === fullValue ? null : fullValue);
      lastTapRef.current = { star: 0, time: 0 };
    } else {
      // Click simple = media estrella
      const halfValue = starIndex - 0.5;
      onChange(value === halfValue ? null : halfValue);
      lastTapRef.current = { star: starIndex, time: now };
    }
  };

  const getStarIcon = (starIndex: number): string => {
    if (!value) return 'star-outline';
    if (value >= starIndex) return 'star';
    if (value >= starIndex - 0.5) return 'star-half-full';
    return 'star-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {Array.from({ length: maxStars }, (_, i) => i + 1).map((starIndex) => (
          <TouchableOpacity
            key={starIndex}
            onPress={() => handlePress(starIndex)}
            disabled={!isEditable}
            activeOpacity={isEditable ? 0.6 : 1}
            style={styles.starTouch}
          >
            <MaterialCommunityIcons
              name={getStarIcon(starIndex) as any}
              size={size}
              color={value && value >= starIndex - 0.5 ? colors.accent : colors.secondary + '50'}
            />
          </TouchableOpacity>
        ))}
      </View>
      {showLabel && value !== null && value !== undefined && (
        <Text style={[styles.label, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
          {value}/10
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starTouch: {
    padding: 1,
  },
  label: {
    fontSize: 14,
  },
});
