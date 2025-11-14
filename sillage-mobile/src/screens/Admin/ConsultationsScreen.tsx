/**
 * ConsultationsScreen - Regalar consultas a usuarios
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, AdminUser, ConsultationStats } from '../../services/adminService';

interface GiftedConsultation {
  id: number;
  user_id: number;
  admin_id: number;
  quantity: number;
  reason: string | null;
  created_at: string;
  new_total: number;
  user_email?: string;
  user_name?: string;
  admin_email?: string;
}

export default function ConsultationsScreen() {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [history, setHistory] = useState<GiftedConsultation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estados de modal
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [gifting, setGifting] = useState(false);

  // Tab activo
  const [activeTab, setActiveTab] = useState<'gift' | 'history'>('gift');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'gift') {
      searchUsersForGift();
    }
  }, [searchUsers, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadStats(), loadHistory()]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al cargar datos';
      setError(errorMsg);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminService.getConsultationStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await adminService.listGiftedConsultations({ limit: 50 });
      setHistory(data.items || []);
    } catch (err: any) {
      console.error('Error cargando historial:', err);
    }
  };

  const searchUsersForGift = async () => {
    if (!searchUsers.trim()) {
      setUsers([]);
      return;
    }

    try {
      const data = await adminService.listUsers({ search: searchUsers, limit: 20 });
      setUsers(data.items);
    } catch (err: any) {
      console.error('Error buscando usuarios:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenGiftModal = (user: AdminUser) => {
    // console.log('🎁 Abriendo modal de regalo para:', user);
    setSelectedUser(user);
    setQuantity('');
    setReason('');
    setGiftModalVisible(true);
    // console.log('🎁 Modal visible set to true');
  };

  const handleGiftConsultations = async () => {
    // console.log('🎁 handleGiftConsultations llamado');
    // console.log('🎁 selectedUser:', selectedUser);
    // console.log('🎁 quantity:', quantity);
    // console.log('🎁 quantity.trim():', quantity.trim());

    if (!selectedUser) {
      // console.log('❌ No hay usuario seleccionado');
      Alert.alert('Error', 'No hay usuario seleccionado');
      return;
    }

    // Validar que se haya ingresado algo
    if (!quantity || quantity.trim() === '') {
      // console.log('❌ Campo de cantidad vacío');
      Alert.alert('Error', 'Por favor ingresa la cantidad de consultas');
      return;
    }

    const qty = parseInt(quantity.trim());
    // console.log('🎁 qty parseado:', qty);

    if (isNaN(qty)) {
      // console.log('❌ Cantidad no es un número');
      Alert.alert('Error', 'Por favor ingresa un número válido');
      return;
    }

    if (qty <= 0 || qty > 1000) {
      // console.log('❌ Cantidad fuera de rango:', qty);
      Alert.alert('Error', 'La cantidad debe ser entre 1 y 1000');
      return;
    }

    try {
      setGifting(true);
      // console.log('🎁 Llamando a adminService.giftConsultations con:', {
      //   userId: selectedUser.id,
      //   quantity: qty,
      //   reason: reason.trim() || undefined
      // });

      const result = await adminService.giftConsultations(selectedUser.id, {
        quantity: qty,
        reason: reason.trim() || undefined,
      });

      // console.log('✅ Consultas regaladas exitosamente:', result);

      Alert.alert(
        'Éxito',
        `Se regalaron ${qty} consulta${qty > 1 ? 's' : ''} a ${selectedUser.first_name} ${selectedUser.last_name}`
      );

      setGiftModalVisible(false);
      setSelectedUser(null);
      setQuantity('');
      setReason('');
      await loadData();
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      const errorMsg = err.response?.data?.detail || err.message || 'Error al regalar consultas';
      Alert.alert('Error', errorMsg);
    } finally {
      setGifting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !stats) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      {/* Header con estadísticas */}
      <View style={{ padding: 20, backgroundColor: AdminColors.white, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
        <Text style={adminStyles.pageTitle}>Regalar Consultas</Text>

        {stats && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.total_consultations_gifted}</Text>
              <Text style={adminStyles.statsCardLabel}>Total regaladas</Text>
            </View>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.unique_recipients}</Text>
              <Text style={adminStyles.statsCardLabel}>Usuarios beneficiados</Text>
            </View>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.average_per_gift.toFixed(1)}</Text>
              <Text style={adminStyles.statsCardLabel}>Promedio por regalo</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            style={[
              adminStyles.button,
              activeTab === 'gift' ? null : adminStyles.buttonSecondary,
              { flex: 1 }
            ]}
            onPress={() => setActiveTab('gift')}
          >
            <MaterialCommunityIcons
              name="gift"
              size={20}
              color={activeTab === 'gift' ? AdminColors.white : AdminColors.textPrimary}
            />
            <Text style={[
              adminStyles.buttonText,
              activeTab === 'gift' ? null : adminStyles.buttonSecondaryText
            ]}>
              Regalar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminStyles.button,
              activeTab === 'history' ? null : adminStyles.buttonSecondary,
              { flex: 1 }
            ]}
            onPress={() => setActiveTab('history')}
          >
            <MaterialCommunityIcons
              name="history"
              size={20}
              color={activeTab === 'history' ? AdminColors.white : AdminColors.textPrimary}
            />
            <Text style={[
              adminStyles.buttonText,
              activeTab === 'history' ? null : adminStyles.buttonSecondaryText
            ]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido según tab */}
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={adminStyles.card}>
            <Text style={{ color: AdminColors.error }}>{error}</Text>
          </View>
        )}

        {/* Tab Regalar */}
        {activeTab === 'gift' && (
          <View>
            <Text style={adminStyles.sectionTitle}>Buscar Usuario</Text>
            <TextInput
              style={adminStyles.input}
              placeholder="Busca por email o nombre..."
              value={searchUsers}
              onChangeText={setSearchUsers}
              placeholderTextColor={AdminColors.gray400}
            />

            {searchUsers.trim() && users.length === 0 && (
              <View style={adminStyles.emptyContainer}>
                <MaterialCommunityIcons name="account-search" size={64} color={AdminColors.gray300} />
                <Text style={adminStyles.emptyText}>No se encontraron usuarios</Text>
              </View>
            )}

            {users.map((user) => (
              <View key={user.id} style={adminStyles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={adminStyles.cardTitle}>
                      {user.first_name} {user.last_name}
                    </Text>
                    <Text style={adminStyles.cardSubtitle}>{user.email}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <View style={[adminStyles.badge, { backgroundColor: AdminColors.infoLight }]}>
                        <Text style={[adminStyles.badgeText, { color: AdminColors.info }]}>
                          {user.consultas_restantes} consultas
                        </Text>
                      </View>
                      {user.suscrito && (
                        <View style={[adminStyles.badge, adminStyles.badgeSuccess]}>
                          <Text style={[adminStyles.badgeText, adminStyles.badgeSuccessText]}>Suscrito</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleOpenGiftModal(user)}
                    style={{
                      backgroundColor: AdminColors.successLight,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons name="gift" size={20} color={AdminColors.success} />
                    <Text style={{ color: AdminColors.success, fontWeight: '600' }}>Regalar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab Historial */}
        {activeTab === 'history' && (
          <View>
            <Text style={adminStyles.sectionTitle}>Historial de Regalos</Text>

            {history.length === 0 && (
              <View style={adminStyles.emptyContainer}>
                <MaterialCommunityIcons name="gift-off" size={64} color={AdminColors.gray300} />
                <Text style={adminStyles.emptyText}>No hay historial de consultas regaladas</Text>
              </View>
            )}

            {history.map((gift) => (
              <View key={gift.id} style={adminStyles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={adminStyles.cardTitle}>
                      Usuario ID: {gift.user_id}
                    </Text>
                    <Text style={adminStyles.cardSubtitle}>
                      {formatDate(gift.created_at)}
                    </Text>
                    {gift.reason && (
                      <Text style={[adminStyles.cardSubtitle, { marginTop: 8, fontStyle: 'italic' }]}>
                        "{gift.reason}"
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[adminStyles.badge, adminStyles.badgeSuccess]}>
                      <Text style={[adminStyles.badgeText, adminStyles.badgeSuccessText]}>
                        +{gift.quantity}
                      </Text>
                    </View>
                    <Text style={[adminStyles.cardSubtitle, { marginTop: 4 }]}>
                      Total: {gift.new_total}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <View style={[adminStyles.badge, { backgroundColor: AdminColors.gray100 }]}>
                    <Text style={[adminStyles.badgeText, { color: AdminColors.textSecondary }]}>
                      Admin ID: {gift.admin_id}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Regalar Consultas */}
      <Modal
        isVisible={giftModalVisible}
        onBackdropPress={() => {
          // console.log('👆 Backdrop presionado');
          if (!gifting) setGiftModalVisible(false);
        }}
        onBackButtonPress={() => {
          // console.log('🔙 Back button presionado');
          if (!gifting) setGiftModalVisible(false);
        }}
        onModalShow={() => console.log('✅ Modal mostrado')}
      >
        <View style={[adminStyles.card, { margin: 20 }]}>
          <View style={{ marginBottom: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <MaterialCommunityIcons name="gift" size={64} color={AdminColors.success} />
            </View>
            <Text style={[adminStyles.pageTitle, { textAlign: 'center' }]}>
              Regalar Consultas
            </Text>
            {selectedUser && (
              <View style={{ marginTop: 12 }}>
                <Text style={[adminStyles.cardTitle, { textAlign: 'center' }]}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Text>
                <Text style={[adminStyles.cardSubtitle, { textAlign: 'center' }]}>
                  {selectedUser.email}
                </Text>
                <Text style={[adminStyles.cardSubtitle, { textAlign: 'center', marginTop: 4 }]}>
                  Consultas actuales: {selectedUser.consultas_restantes}
                </Text>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={adminStyles.inputLabel}>Cantidad de consultas *</Text>
            <TextInput
              style={adminStyles.input}
              value={quantity}
              onChangeText={(text) => {
                // console.log('📝 Cantidad cambiada a:', text);
                setQuantity(text);
              }}
              placeholder="Ej: 10"
              keyboardType="numeric"
              editable={!gifting}
              autoFocus
            />
            <Text style={[adminStyles.cardSubtitle, { marginTop: 4 }]}>
              Máximo: 1000 consultas (Actual: "{quantity}")
            </Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={adminStyles.inputLabel}>Razón (opcional)</Text>
            <TextInput
              style={[adminStyles.input, { minHeight: 80 }]}
              value={reason}
              onChangeText={setReason}
              placeholder="Ej: Bono por cliente frecuente"
              multiline
              numberOfLines={3}
              editable={!gifting}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => {
                // console.log('❌ Botón Cancelar presionado');
                setGiftModalVisible(false);
              }}
              disabled={gifting}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                adminStyles.button,
                adminStyles.buttonSuccess,
                { flex: 1 },
                gifting ? adminStyles.buttonDisabled : null
              ]}
              onPress={() => {
                // console.log('🔵 Botón Regalar presionado - gifting:', gifting);
                if (!gifting) {
                  handleGiftConsultations();
                } else {
                  // console.log('⚠️ Botón deshabilitado porque gifting es true');
                }
              }}
              disabled={gifting}
            >
              {gifting ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="gift" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Regalar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
