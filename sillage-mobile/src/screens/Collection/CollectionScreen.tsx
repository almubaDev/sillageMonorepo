import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { ColeccionPerfumeCard } from '../../components/ColeccionPerfumeCard';
import { ConfirmModal } from '../../components/ConfirmModal';
import { coleccionService, ColeccionStats, PerfumeColeccionData, ImportPerfumeItem } from '../../services/coleccionService';
import coleccionData from '../../data/coleccion_data.json';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CollectionStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<CollectionStackParamList, 'CollectionMain'>;

export const CollectionScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const navigation = useNavigation<NavigationProp>();

  useLanguageChange(() => {
    setError(null);
  });

  const [stats, setStats] = useState<ColeccionStats | null>(null);
  const [perfumes, setPerfumes] = useState<PerfumeColeccionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [perfumeToDelete, setPerfumeToDelete] = useState<PerfumeColeccionData | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce) {
        loadData();
      }
    }, [hasLoadedOnce])
  );

  const loadData = async () => {
    try {
      setError(null);
      if (!hasLoadedOnce) setLoading(true);

      const [statsData, perfumesData] = await Promise.all([
        coleccionService.getColeccion(),
        coleccionService.listPerfumes(),
      ]);

      setStats(statsData);
      setPerfumes(perfumesData);
      setHasLoadedOnce(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || t('collection:error.loadFailed');
      setError(errorMessage);
      if (hasLoadedOnce) {
        Alert.alert(t('collection:error.title'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEdit = (perfumeId: number) => {
    navigation.navigate('AddEditPerfume', { perfumeId });
  };

  const handleDelete = (perfumeId: number) => {
    const perfume = perfumes.find((p) => p.id === perfumeId);
    if (perfume) {
      setPerfumeToDelete(perfume);
      setDeleteModalVisible(true);
    }
  };

  const confirmDelete = async () => {
    if (!perfumeToDelete) return;

    try {
      await coleccionService.deletePerfume(perfumeToDelete.id);
      setDeleteModalVisible(false);
      setPerfumeToDelete(null);
      await loadData();
    } catch (error: any) {
      Alert.alert(
        t('collection:error.title'),
        error.response?.data?.detail || t('collection:error.deleteFailed')
      );
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const perfumes = coleccionData.perfumes as ImportPerfumeItem[];
      const result = await coleccionService.importPerfumes(perfumes);
      setImportModalVisible(false);
      Alert.alert(
        t('collection:import.success'),
        t('collection:import.successMessage', { count: result.imported })
      );
      await loadData();
    } catch (error: any) {
      Alert.alert(
        t('collection:error.title'),
        error.response?.data?.detail || t('collection:import.failed')
      );
    } finally {
      setImporting(false);
    }
  };

  const formatInversion = (value: number) => {
    return `$${Number(value).toLocaleString('es-CL')}`;
  };

  // Loading state
  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {t('collection:loading')}
        </Text>
      </View>
    );
  }

  // Error state
  if (error && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.secondary} />
        <Text style={[styles.errorText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.accent }]}
          onPress={loadData}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.bg} />
          <Text style={[styles.retryButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('collection:error.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={[styles.headerTitle, { color: colors.accent, fontFamily: 'AlanSans-Bold' }]}>
          {stats?.nombre || t('collection:title')}
        </Text>
        <View style={styles.headerStats}>
          <Text style={[styles.headerStat, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {stats?.perfumes_count || 0} {t('collection:header.perfumes')}
          </Text>
          <Text style={[styles.headerStat, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('collection:header.investment')} {formatInversion(stats?.inversion_total || 0)}
          </Text>
        </View>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.importButton, { borderColor: colors.accent }]}
          onPress={() => setImportModalVisible(true)}
        >
          <MaterialCommunityIcons name="database-import-outline" size={20} color={colors.accent} />
          <Text style={[styles.addButtonText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
            {t('collection:import.button')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('AddEditPerfume')}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.bg} />
          <Text style={[styles.addButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('collection:form.addTitle')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {perfumes.length === 0 ? (
        <View style={styles.emptyContainer}>
          {renderHeader()}
          <View style={styles.empty}>
            <MaterialCommunityIcons name="flask-empty-outline" size={80} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
              {t('collection:empty.title')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              {t('collection:empty.subtitle')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.listContainer, isDesktop && styles.listContainerDesktop]}>
          <FlatList
            data={perfumes}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <ColeccionPerfumeCard
                perfume={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
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

      {/* FAB para agregar (solo mobile, en desktop hay boton en header) */}
      {!isDesktop && perfumes.length > 0 && (
        <View style={styles.fab}>
          <TouchableOpacity
            style={[styles.fabButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('AddEditPerfume')}
          >
            <MaterialCommunityIcons name="plus" size={28} color={colors.bg} />
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title={t('collection:delete.title')}
        message={
          perfumeToDelete
            ? `${t('collection:delete.message')}\n\n${perfumeToDelete.nombre}${perfumeToDelete.marca ? ` - ${perfumeToDelete.marca}` : ''}`
            : t('collection:delete.message')
        }
        confirmText={t('collection:delete.confirm')}
        cancelText={t('collection:delete.cancel')}
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPerfumeToDelete(null);
        }}
      />

      <ConfirmModal
        visible={importModalVisible}
        title={t('collection:import.title')}
        message={`${t('collection:import.message')}\n\n${coleccionData.total_perfumes} perfumes`}
        confirmText={importing ? t('collection:import.importing') : t('collection:import.confirm')}
        cancelText={t('collection:import.cancel')}
        type="info"
        onConfirm={handleImport}
        onCancel={() => setImportModalVisible(false)}
      />
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
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontStyle: 'italic',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  headerStat: {
    fontSize: 13,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  listContainerDesktop: {
    maxWidth: 900,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
