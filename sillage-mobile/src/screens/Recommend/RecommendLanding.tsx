import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { coleccionService, PerfumeColeccionData } from '../../services/coleccionService';

interface Props {
  navigation: any;
}

export const RecommendLanding: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [validPerfumes, setValidPerfumes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      checkCollection();
      refreshUser();
    }, [])
  );

  const checkCollection = async () => {
    try {
      setLoading(true);
      const perfumes = await coleccionService.listPerfumes();
      const valid = perfumes.filter(
        (p: PerfumeColeccionData) =>
          p.acordes && p.acordes.length > 0 && p.notas && p.notas.length > 0
      );
      setValidPerfumes(valid.length);
    } catch {
      setValidPerfumes(0);
    } finally {
      setLoading(false);
    }
  };

  const needsMorePerfumes = validPerfumes < 2;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <MaterialCommunityIcons
        name="auto-fix"
        size={64}
        color={colors.accent}
        style={styles.icon}
      />

      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:landing.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:landing.subtitle')}
      </Text>

      <View style={[styles.queriesCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
        <MaterialCommunityIcons name="counter" size={20} color={colors.accent} />
        <Text style={[styles.queriesText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
          {t('recommend:landing.queriesRemaining', { count: user?.consultas_restantes || 0 })}
        </Text>
      </View>

      {needsMorePerfumes ? (
        <View style={styles.warningContainer}>
          <View style={[styles.warningCard, { backgroundColor: '#f59e0b' + '15', borderColor: '#f59e0b' + '40' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#f59e0b" />
            <Text style={[styles.warningTitle, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {t('recommend:landing.minPerfumesTitle')}
            </Text>
            <Text style={[styles.warningText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              {t('recommend:landing.minPerfumesDesc', { current: validPerfumes })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Colección')}
          >
            <MaterialCommunityIcons name="view-agenda" size={24} color={colors.bg} />
            <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
              {t('recommend:landing.goToCollection')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('RecommendForm')}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color={colors.bg} />
            <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
              {t('recommend:landing.newConsultation')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonOutline, { borderColor: colors.accent }]}
            onPress={() => navigation.navigate('History')}
          >
            <MaterialCommunityIcons name="history" size={24} color={colors.accent} />
            <Text style={[styles.buttonText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
              {t('recommend:landing.viewHistory')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  queriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 32,
  },
  queriesText: {
    fontSize: 13,
  },
  warningContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  warningCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
  },
});
