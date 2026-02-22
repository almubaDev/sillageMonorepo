import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';

interface Step2TimeProps {
  value: Date | null;
  onChange: (time: Date) => void;
}

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

interface ScrollPickerProps {
  items: number[];
  selected: number;
  onSelect: (val: number) => void;
  accentColor: string;
  textColor: string;
  secondaryColor: string;
  formatItem?: (val: number) => string;
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({ items, selected, onSelect, accentColor, textColor, secondaryColor, formatItem }) => {
  const scrollRef = useRef<ScrollView>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const format = formatItem || ((v: number) => v.toString().padStart(2, '0'));

  // Padding items para centrar (2 arriba, 2 abajo)
  const paddedItems = [null, null, ...items, null, null];

  const selectedIndex = items.indexOf(selected);

  // Auto-seleccionar el item centrado cuando el scroll se detiene
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Limpiar timer anterior
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    const offsetY = e.nativeEvent.contentOffset.y;

    // Debounce: esperar 100ms sin scroll para considerar que se detuvo
    scrollTimerRef.current = setTimeout(() => {
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

      // Snap al item mas cercano
      scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });

      // Seleccionar automaticamente
      if (items[clampedIndex] !== selected) {
        onSelect(items[clampedIndex]);
      }
    }, 100);
  }, [items, selected, onSelect]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  }, []);

  // Scroll inicial al valor seleccionado
  useEffect(() => {
    if (selectedIndex >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, []);

  return (
    <View style={[pickerStyles.container, { height: PICKER_HEIGHT }]}>
      {/* Highlight de seleccion */}
      <View style={[pickerStyles.highlight, {
        top: ITEM_HEIGHT * 2,
        backgroundColor: accentColor + '25',
        borderColor: accentColor + '50',
      }]} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: 0 }}
      >
        {paddedItems.map((item, idx) => {
          const isSelected = item !== null && item === selected;
          return (
            <TouchableOpacity
              key={idx}
              style={pickerStyles.item}
              onPress={() => {
                if (item !== null) {
                  const itemIndex = items.indexOf(item);
                  onSelect(item);
                  scrollToIndex(itemIndex);
                }
              }}
              activeOpacity={item !== null ? 0.6 : 1}
            >
              <Text style={[
                pickerStyles.itemText,
                { fontFamily: 'Lato-Regular', color: secondaryColor },
                item === null && { opacity: 0 },
                isSelected && { color: textColor, fontFamily: 'Lato-Bold', fontSize: 18 },
              ]}>
                {item !== null ? format(item) : '00'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const Step2Time: React.FC<Step2TimeProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const selectedHour = value ? value.getHours() : 12;
  const selectedMinute = value ? Math.round(value.getMinutes() / 5) * 5 : 0;

  const handleHourSelect = (hour: number) => {
    const newTime = value ? new Date(value) : new Date();
    newTime.setHours(hour);
    newTime.setMinutes(selectedMinute);
    newTime.setSeconds(0);
    onChange(newTime);
  };

  const handleMinuteSelect = (minute: number) => {
    const newTime = value ? new Date(value) : new Date();
    newTime.setHours(selectedHour);
    newTime.setMinutes(minute);
    newTime.setSeconds(0);
    onChange(newTime);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedTime) {
      onChange(selectedTime);
    }
  };

  const formatTime = (time: Date) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return time.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="clock-outline"
        size={40}
        color={colors.accent}
        style={styles.icon}
      />

      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step2.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:step2.subtitle')}
      </Text>

      {Platform.OS === 'web' ? (
        <View style={[styles.clockContainer, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
          <View style={styles.pickersRow}>
            <ScrollPicker
              items={hours}
              selected={selectedHour}
              onSelect={handleHourSelect}
              accentColor={colors.accent}
              textColor={colors.text}
              secondaryColor={colors.secondary}
            />
            <Text style={[styles.separator, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>:</Text>
            <ScrollPicker
              items={minutes}
              selected={selectedMinute}
              onSelect={handleMinuteSelect}
              accentColor={colors.accent}
              textColor={colors.text}
              secondaryColor={colors.secondary}
            />
          </View>
        </View>
      ) : (
        <>
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[styles.timeButton, {
                backgroundColor: colors.accent + '20',
                borderColor: colors.accent
              }]}
              onPress={() => setShowPicker(true)}
            >
              <MaterialCommunityIcons name="clock" size={24} color={colors.accent} />
              <Text style={[styles.timeButtonText, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {value ? formatTime(value) : t('recommend:step2.selectTime')}
              </Text>
            </TouchableOpacity>
          )}

          {showPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={value || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                locale="es-ES"
                themeVariant="dark"
              />
            </View>
          )}
        </>
      )}

      {value && (
        <View style={[styles.selectedContainer, { backgroundColor: colors.accent + '10' }]}>
          <MaterialCommunityIcons name="check-circle" size={18} color={colors.accent} />
          <Text style={[styles.selectedText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            {formatTime(value)}
          </Text>
        </View>
      )}
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  container: {
    width: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  icon: {
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  clockContainer: {
    maxWidth: 180,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    fontSize: 22,
    marginHorizontal: 6,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  timeButtonText: {
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  selectedText: {
    fontSize: 12,
  },
});
