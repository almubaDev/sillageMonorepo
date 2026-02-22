import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';

interface Props {
  navigation: any;
}

export const RecommendLanding: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuthContext();

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
