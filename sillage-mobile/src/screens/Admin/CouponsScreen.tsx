/**
 * CouponsScreen - Gestión de cupones
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
  Clipboard,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import {
  adminService,
  CouponBatch,
  CouponBatchWithCoupons,
  CouponCode,
  CouponStats,
  CouponType,
} from '../../services/adminService';

export default function CouponsScreen() {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batches, setBatches] = useState<CouponBatch[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de modales
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<CouponBatchWithCoupons | null>(null);

  // Estados de formulario
  const [formData, setFormData] = useState({
    title: '',
    type: CouponType.SINGLE_USE,
    consultations_amount: '',
    total_coupons: '',
    expiration_date: '',
    custom_code: '',
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    consultations_amount: '',
    total_coupons: '',
    expiration_date: '',
    custom_code: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadBatches(), loadStats()]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al cargar datos';
      setError(errorMsg);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const data = await adminService.listCouponBatches({ limit: 100 });
      setBatches(data.items);
    } catch (err: any) {
      console.error('Error cargando lotes:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminService.getCouponStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: CouponType.SINGLE_USE,
      consultations_amount: '',
      total_coupons: '',
      expiration_date: '',
      custom_code: '',
    });
    setFormErrors({
      title: '',
      consultations_amount: '',
      total_coupons: '',
      expiration_date: '',
      custom_code: '',
    });
  };

  const validateForm = (): boolean => {
    let errors = {
      title: '',
      consultations_amount: '',
      total_coupons: '',
      expiration_date: '',
      custom_code: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'El título es obligatorio';
      isValid = false;
    }

    const consultations = parseInt(formData.consultations_amount);
    if (!consultations || consultations <= 0 || consultations > 1000) {
      errors.consultations_amount = 'Debe ser entre 1 y 1000';
      isValid = false;
    }

    // Para SINGLE_USE validamos cantidad de cupones
    if (formData.type === CouponType.SINGLE_USE) {
      const coupons = parseInt(formData.total_coupons);
      if (!coupons || coupons <= 0 || coupons > 1000) {
        errors.total_coupons = 'Debe ser entre 1 y 1000';
        isValid = false;
      }
    }

    // Para MULTI_USE validamos fecha de expiración
    if (formData.type === CouponType.MULTI_USE && !formData.expiration_date.trim()) {
      errors.expiration_date = 'Los cupones multi-uso requieren fecha de expiración';
      isValid = false;
    }

    // Validar código personalizado si se proporciona
    if (formData.custom_code && formData.custom_code.trim()) {
      const code = formData.custom_code.trim();
      if (code.length < 3) {
        errors.custom_code = 'Mínimo 3 caracteres';
        isValid = false;
      } else if (!/^[A-Z0-9-]+$/.test(code.toUpperCase())) {
        errors.custom_code = 'Solo letras mayúsculas, números y guiones';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setCreating(true);

      const newBatch = {
        title: formData.title.trim(),
        type: formData.type,
        consultations_amount: parseInt(formData.consultations_amount),
        // Para multi-uso siempre es 1 código, para single-use es la cantidad ingresada
        total_coupons: formData.type === CouponType.MULTI_USE ? 1 : parseInt(formData.total_coupons),
        expiration_date: formData.type === CouponType.MULTI_USE ? formData.expiration_date : null,
        custom_code: formData.type === CouponType.MULTI_USE && formData.custom_code ? formData.custom_code.trim().toUpperCase() : null,
      };

      await adminService.createCouponBatch(newBatch);
      const successMsg = formData.type === CouponType.MULTI_USE
        ? 'Cupón multi-uso creado correctamente'
        : `Lote de ${newBatch.total_coupons} cupones creado correctamente`;
      Alert.alert('Éxito', successMsg);
      setCreateModalVisible(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al crear lote de cupones';
      Alert.alert('Error', errorMsg);
      console.error('Error creando lote:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDetail = async (batch: CouponBatch) => {
    try {
      const detail = await adminService.getCouponBatchDetail(batch.id);
      setSelectedBatch(detail);
      setDetailModalVisible(true);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo cargar el detalle del lote');
      console.error('Error cargando detalle:', err);
    }
  };

  const handleDeleteBatch = (batch: CouponBatch) => {
    Alert.alert(
      'Eliminar Lote',
      `¿Eliminar el lote "${batch.title}" y todos sus ${batch.total_coupons} cupones?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteCouponBatch(batch.id);
              Alert.alert('Éxito', 'Lote eliminado correctamente');
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', 'No se pudo eliminar el lote');
              console.error('Error eliminando lote:', err);
            }
          },
        },
      ]
    );
  };

  const handleDeleteCoupon = (coupon: CouponCode) => {
    Alert.alert(
      'Eliminar Cupón',
      `¿Eliminar el cupón ${coupon.code}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteSingleCoupon(coupon.id);
              Alert.alert('Éxito', 'Cupón eliminado correctamente');
              if (selectedBatch) {
                const detail = await adminService.getCouponBatchDetail(selectedBatch.id);
                setSelectedBatch(detail);
              }
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', 'No se pudo eliminar el cupón');
              console.error('Error eliminando cupón:', err);
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  };

  const copyAllCoupons = () => {
    if (!selectedBatch) return;

    const allCodes = selectedBatch.coupons.map(c => c.code).join('\n');
    Clipboard.setString(allCodes);
    Alert.alert('Copiado', `${selectedBatch.coupons.length} códigos copiados al portapapeles`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !stats) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando cupones...</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      {/* Header con estadísticas */}
      <View style={{ padding: 20, backgroundColor: AdminColors.white, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={adminStyles.pageTitle}>Cupones</Text>
          <TouchableOpacity style={adminStyles.button} onPress={handleOpenCreate}>
            <MaterialCommunityIcons name="plus" size={20} color={AdminColors.white} />
            <Text style={adminStyles.buttonText}>Crear Lote</Text>
          </TouchableOpacity>
        </View>

        {stats && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.total_batches}</Text>
              <Text style={adminStyles.statsCardLabel}>Lotes creados</Text>
            </View>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.total_coupons_generated}</Text>
              <Text style={adminStyles.statsCardLabel}>Cupones generados</Text>
            </View>
            <View style={[adminStyles.statsCard, { flex: 1 }]}>
              <Text style={adminStyles.statsCardValue}>{stats.total_coupons_used}</Text>
              <Text style={adminStyles.statsCardLabel}>Cupones usados</Text>
            </View>
          </View>
        )}
      </View>

      {/* Lista de lotes */}
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

        {batches.length === 0 && !loading && (
          <View style={adminStyles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={64} color={AdminColors.gray300} />
            <Text style={adminStyles.emptyText}>No hay lotes de cupones</Text>
            <TouchableOpacity style={[adminStyles.button, { marginTop: 16 }]} onPress={handleOpenCreate}>
              <MaterialCommunityIcons name="plus" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>Crear primer lote</Text>
            </TouchableOpacity>
          </View>
        )}

        {batches.map((batch) => (
          <TouchableOpacity
            key={batch.id}
            style={adminStyles.card}
            onPress={() => handleOpenDetail(batch)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={adminStyles.cardTitle}>{batch.title}</Text>
                <Text style={adminStyles.cardSubtitle}>Creado: {formatDate(batch.created_at)}</Text>
                {batch.expiration_date && (
                  <Text style={[adminStyles.cardSubtitle, { marginTop: 4 }]}>
                    Expira: {formatDate(batch.expiration_date)}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[adminStyles.badge, batch.type === CouponType.MULTI_USE ? adminStyles.badgeInfo : adminStyles.badgeSuccess]}>
                  <Text style={[adminStyles.badgeText, batch.type === CouponType.MULTI_USE ? adminStyles.badgeInfoText : adminStyles.badgeSuccessText]}>
                    {batch.type === CouponType.MULTI_USE ? 'Multi-uso' : 'Un solo uso'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteBatch(batch);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: AdminColors.errorLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={AdminColors.error} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={[adminStyles.badge, { backgroundColor: AdminColors.primaryLight }]}>
                <Text style={[adminStyles.badgeText, { color: AdminColors.primary }]}>
                  {batch.consultations_amount} consultas
                </Text>
              </View>
              <View style={[adminStyles.badge, { backgroundColor: AdminColors.gray100 }]}>
                <Text style={[adminStyles.badgeText, { color: AdminColors.textSecondary }]}>
                  {batch.total_coupons} cupones
                </Text>
              </View>
              <View style={[adminStyles.badge, adminStyles.badgeSuccess]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeSuccessText]}>
                  {batch.available_count} disponibles
                </Text>
              </View>
              <View style={[adminStyles.badge, { backgroundColor: AdminColors.warningLight }]}>
                <Text style={[adminStyles.badgeText, { color: AdminColors.warning }]}>
                  {batch.used_count} usados
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal Crear Lote */}
      <Modal
        isVisible={createModalVisible}
        onBackdropPress={() => !creating && setCreateModalVisible(false)}
        onBackButtonPress={() => !creating && setCreateModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: AdminColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <Text style={adminStyles.pageTitle}>Crear Lote de Cupones</Text>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={adminStyles.inputLabel}>Título *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.title ? adminStyles.inputError : null]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ej: Promo Black Friday 2024"
              editable={!creating}
            />
            {formErrors.title ? <Text style={adminStyles.inputErrorText}>{formErrors.title}</Text> : null}

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Tipo de cupón *</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[
                  adminStyles.button,
                  formData.type === CouponType.SINGLE_USE ? null : adminStyles.buttonSecondary,
                  { flex: 1 }
                ]}
                onPress={() => setFormData({ ...formData, type: CouponType.SINGLE_USE, expiration_date: '' })}
                disabled={creating}
              >
                <Text style={[
                  adminStyles.buttonText,
                  formData.type === CouponType.SINGLE_USE ? null : adminStyles.buttonSecondaryText
                ]}>
                  Un solo uso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  adminStyles.button,
                  formData.type === CouponType.MULTI_USE ? null : adminStyles.buttonSecondary,
                  { flex: 1 }
                ]}
                onPress={() => setFormData({ ...formData, type: CouponType.MULTI_USE })}
                disabled={creating}
              >
                <Text style={[
                  adminStyles.buttonText,
                  formData.type === CouponType.MULTI_USE ? null : adminStyles.buttonSecondaryText
                ]}>
                  Multi-uso
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Consultas por cupón *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.consultations_amount ? adminStyles.inputError : null]}
              value={formData.consultations_amount}
              onChangeText={(text) => setFormData({ ...formData, consultations_amount: text })}
              placeholder="Ej: 10"
              keyboardType="numeric"
              editable={!creating}
            />
            {formErrors.consultations_amount ? <Text style={adminStyles.inputErrorText}>{formErrors.consultations_amount}</Text> : null}

            {formData.type === CouponType.SINGLE_USE && (
              <>
                <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Cantidad de cupones a generar *</Text>
                <TextInput
                  style={[adminStyles.input, formErrors.total_coupons ? adminStyles.inputError : null]}
                  value={formData.total_coupons}
                  onChangeText={(text) => setFormData({ ...formData, total_coupons: text })}
                  placeholder="Ej: 100"
                  keyboardType="numeric"
                  editable={!creating}
                />
                {formErrors.total_coupons ? <Text style={adminStyles.inputErrorText}>{formErrors.total_coupons}</Text> : null}
                <Text style={{ fontSize: 12, color: AdminColors.textSecondary, marginTop: 4 }}>
                  Cada código se puede usar una sola vez. Se generarán múltiples códigos únicos.
                </Text>
              </>
            )}

            {formData.type === CouponType.MULTI_USE && (
              <>
                <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Código personalizado (opcional)</Text>
                <TextInput
                  style={[adminStyles.input, formErrors.custom_code ? adminStyles.inputError : null]}
                  value={formData.custom_code}
                  onChangeText={(text) => setFormData({ ...formData, custom_code: text.toUpperCase() })}
                  placeholder="Ej: PROMO2024"
                  autoCapitalize="characters"
                  editable={!creating}
                />
                {formErrors.custom_code ? <Text style={adminStyles.inputErrorText}>{formErrors.custom_code}</Text> : null}
                <Text style={{ fontSize: 12, color: AdminColors.textSecondary, marginTop: 4 }}>
                  Deja vacío para generar un código automático
                </Text>

                <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Fecha de expiración *</Text>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  disabled={creating}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: formErrors.expiration_date ? AdminColors.error : AdminColors.border,
                    borderRadius: '8px',
                    backgroundColor: AdminColors.white,
                    color: AdminColors.textPrimary,
                    fontFamily: 'inherit',
                  }}
                />
                {formErrors.expiration_date ? <Text style={adminStyles.inputErrorText}>{formErrors.expiration_date}</Text> : null}
                <Text style={{ fontSize: 12, color: AdminColors.textSecondary, marginTop: 4 }}>
                  Se generará un solo código reutilizable hasta esta fecha.
                </Text>
              </>
            )}
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: AdminColors.border, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => setCreateModalVisible(false)}
              disabled={creating}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, { flex: 1 }, creating && adminStyles.buttonDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Crear</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Detalle de Lote */}
      <Modal
        isVisible={detailModalVisible}
        onBackdropPress={() => setDetailModalVisible(false)}
        onBackButtonPress={() => setDetailModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: AdminColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={adminStyles.pageTitle}>{selectedBatch?.title}</Text>
                <Text style={adminStyles.cardSubtitle}>
                  {selectedBatch?.total_coupons} cupones - {selectedBatch?.consultations_amount} consultas cada uno
                </Text>
              </View>
              <TouchableOpacity
                onPress={copyAllCoupons}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: AdminColors.primaryLight,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="content-copy" size={18} color={AdminColors.primary} />
                <Text style={{ color: AdminColors.primary, fontWeight: '600', fontSize: 14 }}>
                  Copiar todos
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {selectedBatch?.coupons.map((coupon) => (
              <View key={coupon.id} style={[adminStyles.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => copyToClipboard(coupon.code)}>
                      <Text style={[adminStyles.cardTitle, { fontFamily: 'monospace' }]}>{coupon.code}</Text>
                    </TouchableOpacity>
                    {coupon.is_used && coupon.used_at && (
                      <Text style={[adminStyles.cardSubtitle, { marginTop: 4 }]}>
                        Usado: {formatDate(coupon.used_at)}
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[adminStyles.badge, coupon.is_used ? adminStyles.badgeWarning : adminStyles.badgeSuccess]}>
                      <Text style={[adminStyles.badgeText, coupon.is_used ? adminStyles.badgeWarningText : adminStyles.badgeSuccessText]}>
                        {coupon.is_used ? 'Usado' : 'Disponible'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => copyToClipboard(coupon.code)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: AdminColors.primaryLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="content-copy" size={16} color={AdminColors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteCoupon(coupon)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: AdminColors.errorLight,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color={AdminColors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: AdminColors.border }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary]}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
