// sillage-mobile/src/screens/History/HistoryScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { HistoryCard } from '../../components/HistoryCard';
import { recommendationService, RecommendationResponse } from '../../services/recommendationService';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  History: undefined;
  RecommendationResult: {
    recommendation: RecommendationResponse;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [history, setHistory] = useState<RecommendationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar errores cuando cambia el idioma
  useLanguageChange(() => {
    setError(null);
  });

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationService.getHistory(50, 0);
      setHistory(data);
    } catch (error: any) {
      console.error('Error cargando historial:', error);
      setError(t('history:error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleCardPress = (recommendation: RecommendationResponse) => {
    navigation.navigate('RecommendationResult', {
      recommendation,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {t('history:loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.secondary} />
        <Text style={[styles.errorText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="history" size={80} color={colors.secondary} />
          <Text style={[styles.emptyText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('history:empty.title')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('history:empty.subtitle')}
          </Text>
        </View>
      ) : (
        <View style={[styles.listContainer, isDesktop && styles.listContainerDesktop]}>
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <HistoryCard
                recommendation={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContainer: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  listContainerDesktop: {
    maxWidth: 800,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
