import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { RecommendationFormData } from '../types';

// Importar CSS para scrollbars visibles en web
if (Platform.OS === 'web') {
  require('../scrollbar.css');
}

interface Step7SummaryProps {
  data: RecommendationFormData;
  onEdit: (step: number) => void;
}

export const Step7Summary: React.FC<Step7SummaryProps> = ({ data, onEdit }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return time.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const summaryItems = [
    {
      step: 1,
      icon: 'calendar',
      label: t('recommend:step7.fields.date'),
      value: data.fecha ? formatDate(data.fecha) : t('recommend:step7.notDefined'),
    },
    {
      step: 2,
      icon: 'clock',
      label: t('recommend:step7.fields.time'),
      value: data.hora ? formatTime(data.hora) : t('recommend:step7.notDefined'),
    },
    {
      step: 3,
      icon: 'map-marker',
      label: t('recommend:step7.fields.placeType'),
      value: data.tipoLugar ? (data.tipoLugar === 'abierto' ? t('recommend:step7.placeOpen') : t('recommend:step7.placeClosed')) : t('recommend:step7.notDefinedMale'),
    },
    {
      step: 4,
      icon: 'calendar-star',
      label: t('recommend:step7.fields.occasion'),
      value: data.ocasion || t('recommend:step7.notDefined'),
    },
    {
      step: 5,
      icon: 'emoticon-happy',
      label: t('recommend:step7.fields.expectation'),
      value: data.expectativa || t('recommend:step7.notDefined'),
    },
    {
      step: 6,
      icon: 'tshirt-crew',
      label: t('recommend:step7.fields.clothing'),
      value: data.vestimenta || t('recommend:step7.notDefined'),
    },
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
      // @ts-ignore - className solo para web
      className={Platform.OS === 'web' ? 'scrollbar-visible' : undefined}
    >
      <MaterialCommunityIcons 
        name="clipboard-check" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step7.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:step7.subtitle')}
      </Text>

      <View style={styles.list}>
        {summaryItems.map((item) => (
          <View
            key={item.step}
            style={[styles.summaryCard, { 
              backgroundColor: colors.bg, 
              borderColor: colors.accent + '30' 
            }]}
          >
            <View style={styles.cardContent}>
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={24} 
                color={colors.accent} 
              />
              <View style={styles.textContent}>
                <Text style={[styles.label, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  {item.label}
                </Text>
                <Text style={[styles.value, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                  {item.value}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.accent + '20' }]}
              onPress={() => onEdit(item.step)}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.accent + '10' }]}>
        <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
          {t('recommend:step7.infoMessage')}
        </Text>
      </View>
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
  list: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});