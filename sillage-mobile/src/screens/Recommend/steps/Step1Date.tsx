import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';

interface Step1DateProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

// Helpers para comparar solo fechas (sin hora)
const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const Step1Date: React.FC<Step1DateProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const today = toDateOnly(new Date());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 4);

  // Estado para el mes visible en el calendario web
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Generar dias del calendario para el mes visible
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    // Lunes = 0, Domingo = 6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: { date: Date; inMonth: boolean }[] = [];

    // Dias del mes anterior para rellenar
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      days.push({ date: d, inMonth: false });
    }

    // Dias del mes actual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
    }

    // Rellenar hasta completar la ultima fila (multiplo de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(viewYear, viewMonth + 1, d), inMonth: false });
    }

    return days;
  }, [viewMonth, viewYear]);

  const dayLabels = useMemo(() => {
    if (i18n.language === 'en') return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    return ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  }, [i18n.language]);

  const monthLabel = useMemo(() => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    const d = new Date(viewYear, viewMonth, 1);
    const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [viewMonth, viewYear, i18n.language]);

  const canGoPrev = viewMonth !== today.getMonth() || viewYear !== today.getFullYear();
  const canGoNext = viewMonth !== maxDate.getMonth() || viewYear !== maxDate.getFullYear();

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isDayEnabled = (date: Date) => {
    const d = toDateOnly(date);
    return d >= today && d <= maxDate;
  };

  const handleDayPress = (date: Date) => {
    if (!isDayEnabled(date)) return;
    const selected = new Date(date);
    selected.setHours(12, 0, 0, 0);
    onChange(selected);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="calendar-month"
        size={40}
        color={colors.accent}
        style={styles.icon}
      />

      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step1.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:step1.subtitle')}
      </Text>

      {Platform.OS === 'web' ? (
        <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
          {/* Header del mes */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={[styles.navButton, !canGoPrev && { opacity: 0.2 }]} disabled={!canGoPrev}>
              <MaterialCommunityIcons name="chevron-left" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {monthLabel}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={[styles.navButton, !canGoNext && { opacity: 0.2 }]} disabled={!canGoNext}>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Dias de la semana */}
          <View style={styles.weekRow}>
            {dayLabels.map((label) => (
              <Text key={label} style={[styles.dayLabel, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Grilla de dias */}
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, week) => (
            <View key={week} style={styles.weekRow}>
              {calendarDays.slice(week * 7, week * 7 + 7).map(({ date, inMonth }, idx) => {
                const enabled = inMonth && isDayEnabled(date);
                const isSelected = value && inMonth && isSameDay(date, value);
                const isToday = inMonth && isSameDay(date, today);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: colors.accent, borderRadius: 13 },
                      isToday && !isSelected && { borderWidth: 1, borderColor: colors.accent, borderRadius: 13 },
                    ]}
                    onPress={() => inMonth && handleDayPress(date)}
                    disabled={!enabled}
                    activeOpacity={enabled ? 0.6 : 1}
                  >
                    <Text style={[
                      styles.dayText,
                      { fontFamily: 'Lato-Regular' },
                      inMonth && enabled ? { color: colors.text } : { color: colors.text, opacity: 0.25 },
                      !inMonth && { opacity: 0.15 },
                      isSelected && { color: '#000', fontFamily: 'Lato-Bold' },
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      ) : (
        <>
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[styles.dateButton, {
                backgroundColor: colors.accent + '20',
                borderColor: colors.accent
              }]}
              onPress={() => setShowPicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={24} color={colors.accent} />
              <Text style={[styles.dateButtonText, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {value ? formatDate(value) : t('recommend:step1.selectDate')}
              </Text>
            </TouchableOpacity>
          )}

          {showPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={value || today}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={today}
                maximumDate={maxDate}
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
            {formatDate(value)}
          </Text>
        </View>
      )}
    </View>
  );
};

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
  calendarContainer: {
    width: '100%',
    maxWidth: 230,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  navButton: {
    padding: 2,
  },
  monthLabel: {
    fontSize: 13,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayLabel: {
    width: 26,
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 4,
  },
  dayCell: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayText: {
    fontSize: 11,
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  dateButtonText: {
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