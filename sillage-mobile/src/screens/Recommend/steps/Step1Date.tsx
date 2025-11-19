import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';

// Importar CSS para inputs de fecha/hora en web
if (Platform.OS === 'web') {
  require('../date-time-picker.css');
}

interface Step1DateProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

export const Step1Date: React.FC<Step1DateProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 5);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleWebDateChange = (dateString: string) => {
    if (dateString) {
      const selectedDate = new Date(dateString + 'T12:00:00');
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

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDateStr = formatDateForInput(today);
  const maxDateStr = formatDateForInput(maxDate);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="calendar-month" 
        size={64} 
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
        <View style={styles.webPickerContainer}>
          <input
            type="date"
            value={value ? formatDateForInput(value) : ''}
            onChange={(e) => handleWebDateChange(e.target.value)}
            min={minDateStr}
            max={maxDateStr}
            style={{
              height: 56,
              width: 162,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: colors.accent,
              borderRadius: 12,
              paddingLeft: 16,
              paddingRight: 60,
              fontSize: 16,
              backgroundColor: colors.accent + '20',
              color: colors.text,
              fontFamily: 'Lato-Regular',
              textAlign: 'center',
              display: 'block',
            }}
          />
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
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
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
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  webPickerContainer: {
    width: '100%',
    maxWidth: 162,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  selectedText: {
    fontSize: 14,
  },
});