import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { PerfumeCard } from '../../components/PerfumeCard';
import { ConfirmModal } from '../../components/ConfirmModal';
import { perfumeService, PerfumeInCollection, Perfume } from '../../services/perfumeService';
import { useFocusEffect } from '@react-navigation/native';

export const CollectionScreen = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const [perfumes, setPerfumes] = useState<PerfumeInCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [perfumeToDelete, setPerfumeToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Perfume[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newPerfume, setNewPerfume] = useState({
    nombre: '',
    marca: '',
    perfumista: '',
    notas: '',
    acordes: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [])
  );

  const loadCollection = async () => {
    try {
      setLoading(true);
      const data = await perfumeService.getMyCollection();
      setPerfumes(data);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar tu colección');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollection();
    setRefreshing(false);
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await perfumeService.search({ q: query, limit: 20 });
      setSearchResults(results);
    } catch (error: any) {
      console.error('Error en búsqueda:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCollection = async (perfumeId: number) => {
    try {
      await perfumeService.addToCollection(perfumeId);
      setSearchModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      await loadCollection();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'No se pudo agregar el perfume';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleRemoveFromCollection = (perfumeId: number) => {
    setPerfumeToDelete(perfumeId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!perfumeToDelete) return;

    try {
      await perfumeService.removeFromCollection(perfumeToDelete);
      setDeleteModalVisible(false);
      setPerfumeToDelete(null);
      await loadCollection();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo eliminar el perfume');
    }
  };

  const handleCreatePerfume = async () => {
    if (!newPerfume.nombre.trim() || !newPerfume.marca.trim()) {
      Alert.alert('Error', 'Nombre y marca son obligatorios');
      return;
    }

    try {
      setCreating(true);
      const perfumeData = {
        nombre: newPerfume.nombre.trim(),
        marca: newPerfume.marca.trim(),
        perfumista: newPerfume.perfumista.trim() || undefined,
        notas: newPerfume.notas ? newPerfume.notas.split(',').map(n => n.trim()).filter(n => n) : [],
        acordes: newPerfume.acordes ? newPerfume.acordes.split(',').map(a => a.trim()).filter(a => a) : [],
      };

      await perfumeService.createPerfume(perfumeData);
      setCreateModalVisible(false);
      setNewPerfume({ nombre: '', marca: '', perfumista: '', notas: '', acordes: '' });
      await loadCollection();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo crear el perfume');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          Cargando tu colección...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {perfumes.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="flask-empty-outline" size={80} color={colors.secondary} />
          <Text style={[styles.emptyText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            Tu colección está vacía
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            Busca perfumes existentes o crea uno nuevo
          </Text>
        </View>
      ) : (
        <View style={[styles.listContainer, isDesktop && styles.listContainerDesktop]}>
          <FlatList
            data={perfumes}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <PerfumeCard 
                perfume={item} 
                onRemove={handleRemoveFromCollection}
                showRemove={true}
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

      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.accent }]}
          onPress={() => setSearchModalVisible(true)}
        >
          <MaterialCommunityIcons name="magnify" size={26} color={colors.bg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.accent }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={26} color={colors.bg} />
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={searchModalVisible}
        onBackdropPress={() => {
          setSearchModalVisible(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        style={styles.modalFullScreen}
        animationIn="slideInRight"
        animationOut="slideOutRight"
      >
        <View style={[styles.modalFullContent, { backgroundColor: colors.bg }]}>
          <View style={[styles.searchHeader, { backgroundColor: colors.bg, borderBottomColor: colors.accent + '30' }]}>
            <TouchableOpacity 
              onPress={() => {
                setSearchModalVisible(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.secondary} />
              <TextInput
                style={[styles.searchInputInline, { 
                  color: colors.text,
                  fontFamily: 'Lato-Regular'
                }]}
                placeholder="Buscar perfume..."
                placeholderTextColor={colors.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searching && searchQuery.length >= 1 ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[styles.searchingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Buscando...
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.resultItem, { borderBottomColor: colors.secondary + '15' }]}
                  onPress={() => handleAddToCollection(item.id)}
                >
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                      {item.nombre}
                    </Text>
                    <Text style={[styles.resultBrand, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                      {item.marca}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle" size={28} color={colors.accent} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 1 && !searching ? (
                  <View style={styles.emptySearch}>
                    <MaterialCommunityIcons name="flask-empty-off-outline" size={64} color={colors.secondary} />
                    <Text style={[styles.emptySearchText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
                      No se encontraron perfumes
                    </Text>
                    <Text style={[styles.emptySearchSubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                      Intenta con otro término o crea uno nuevo
                    </Text>
                  </View>
                ) : null
              }
              contentContainerStyle={styles.resultsList}
            />
          )}
        </View>
      </Modal>

      <Modal
        isVisible={createModalVisible}
        onBackdropPress={() => setCreateModalVisible(false)}
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
              Crear Perfume
            </Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.bg, 
              color: colors.text, 
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder="Nombre del perfume *"
            placeholderTextColor={colors.secondary}
            value={newPerfume.nombre}
            onChangeText={(text) => setNewPerfume({ ...newPerfume, nombre: text })}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.bg, 
              color: colors.text, 
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder="Marca *"
            placeholderTextColor={colors.secondary}
            value={newPerfume.marca}
            onChangeText={(text) => setNewPerfume({ ...newPerfume, marca: text })}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.bg, 
              color: colors.text, 
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder="Perfumista (opcional)"
            placeholderTextColor={colors.secondary}
            value={newPerfume.perfumista}
            onChangeText={(text) => setNewPerfume({ ...newPerfume, perfumista: text })}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.bg, 
              color: colors.text, 
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder="Acordes (separados por comas)"
            placeholderTextColor={colors.secondary}
            value={newPerfume.acordes}
            onChangeText={(text) => setNewPerfume({ ...newPerfume, acordes: text })}
            multiline
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.bg, 
              color: colors.text, 
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder="Notas (separadas por comas)"
            placeholderTextColor={colors.secondary}
            value={newPerfume.notas}
            onChangeText={(text) => setNewPerfume({ ...newPerfume, notas: text })}
            multiline
          />

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={handleCreatePerfume}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={[styles.createButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
                Crear y Agregar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Eliminar Perfume"
        message="¿Estás seguro de que deseas eliminar este perfume de tu colección? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPerfumeToDelete(null);
        }}
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
    paddingBottom: 100,
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
    gap: 12,
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
  modalFullScreen: {
    margin: 0,
  },
  modalFullContent: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputInline: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 12,
    fontSize: 14,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    marginBottom: 4,
  },
  resultBrand: {
    fontSize: 14,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  emptySearchSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
  },
  createButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    fontSize: 16,
  },
});