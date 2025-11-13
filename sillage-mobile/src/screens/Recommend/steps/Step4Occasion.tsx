import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { OCASIONES } from '../types';

interface Step4OccasionProps {
  value: string;
  onChange: (occasion: string) => void;
}

export const Step4Occasion: React.FC<Step4OccasionProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelectOccasion = (id: string) => {
    if (id === 'otro') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(id);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <MaterialCommunityIcons 
        name="calendar-star" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step4.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:step4.subtitle')}
      </Text>

      <View style={styles.grid}>
        {OCASIONES.map((ocasion) => (
          <TouchableOpacity
            key={ocasion.id}
            style={[
              styles.card,
              {
                backgroundColor: value === ocasion.id ? colors.accent + '20' : colors.bg,
                borderColor: value === ocasion.id ? colors.accent : colors.secondary + '40',
              },
            ]}
            onPress={() => handleSelectOccasion(ocasion.id)}
          >
            <MaterialCommunityIcons
              name={ocasion.icon as any}
              size={32}
              color={value === ocasion.id ? colors.accent : colors.secondary}
            />
            <Text
              style={[
                styles.cardLabel,
                {
                  color: value === ocasion.id ? colors.text : colors.secondary,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {t(`recommend:step4.occasions.${ocasion.id}`)}
            </Text>
            {value === ocasion.id && (
              <View style={styles.checkMark}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {showCustom && (
        <View style={styles.customContainer}>
          <TextInput
            style={[styles.customInput, {
              backgroundColor: colors.bg,
              color: colors.text,
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular',
            }]}
            placeholder={t('recommend:step4.customPlaceholder')}
            placeholderTextColor={colors.secondary}
            value={customValue}
            onChangeText={setCustomValue}
            onSubmitEditing={handleCustomSubmit}
          />
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: colors.accent }]}
            onPress={handleCustomSubmit}
          >
            <Text style={[styles.customButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
              {t('recommend:step4.confirm')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
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
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  cardLabel: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  customContainer: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  customInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  customButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonText: {
    fontSize: 15,
  },
});