import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';

interface Step2TimeProps {
  value: Date | null;
  onChange: (time: Date) => void;
}

export const Step2Time: React.FC<Step2TimeProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedTime) {
      onChange(selectedTime);
    }
  };

  const handleWebTimeChange = (timeString: string) => {
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const newTime = new Date();
      newTime.setHours(parseInt(hours, 10));
      newTime.setMinutes(parseInt(minutes, 10));
      onChange(newTime);
    }
  };

  const formatTime = (time: Date) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return time.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeForInput = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="clock-outline" 
        size={64} 
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
        <View style={styles.webPickerContainer}>
          <input
            type="time"
            value={value ? formatTimeForInput(value) : ''}
            onChange={(e) => handleWebTimeChange(e.target.value)}
            style={{
              height: 56,
              width: '100%',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: colors.accent,
              borderRadius: 12,
              paddingLeft: 20,
              paddingRight: 40,
              fontSize: 16,
              backgroundColor: colors.accent + '20',
              color: colors.text,
              fontFamily: 'Lato-Regular',
              textAlign: 'center',
            }}
          />
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
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
          <Text style={[styles.selectedText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            {formatTime(value)}
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
    width: '75%',
    maxWidth: 240,
    marginBottom: 24,
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