/**
 * UserDetailScreen - Detalle y gestión de un usuario individual
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, AdminUser } from '../../services/adminService';

interface Props {
  route: { params: { userId: number } };
  navigation: any;
}

export default function UserDetailScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [promoteModal, setPromoteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Campos de modales
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getUser(userId);
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setActionError('Ingresa la nueva contraseña');
      return;
    }
    if (newPassword.length < 6) {
      setActionError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setActionError('Las contraseñas no coinciden');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await adminService.adminResetPassword(userId, newPassword);
      setResetPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Listo', 'Contraseña reseteada exitosamente');
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Error al resetear contraseña');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!adminPassword.trim()) {
      setActionError('Ingresa tu contraseña para confirmar');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await adminService.promoteSuperuser(userId, adminPassword);
      setPromoteModal(false);
      setAdminPassword('');
      Alert.alert('Listo', 'Usuario promovido a superusuario');
      loadUser();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Error al promover usuario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setActionLoading(true);
      setActionError('');
      await adminService.deactivateUser(userId);
      setDeleteModal(false);
      Alert.alert('Listo', 'Usuario desactivado');
      loadUser();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Error al desactivar usuario');
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setResetPasswordModal(false);
    setPromoteModal(false);
    setDeleteModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setAdminPassword('');
    setActionError('');
    setActionLoading(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando usuario...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={adminStyles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={AdminColors.error} />
        <Text style={[adminStyles.emptyText, { color: AdminColors.error }]}>{error}</Text>
        <TouchableOpacity style={[adminStyles.button, { marginTop: 16 }]} onPress={loadUser}>
          <Text style={adminStyles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      <ScrollView style={adminStyles.scrollContainer} contentContainerStyle={adminStyles.scrollContent}>
        {/* Header del usuario */}
        <View style={adminStyles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: AdminColors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialCommunityIcons
                name={user.is_superuser ? 'shield-crown' : 'account'}
                size={32}
                color={AdminColors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={adminStyles.cardTitle}>{user.first_name} {user.last_name}</Text>
              <Text style={adminStyles.cardSubtitle}>{user.email}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {user.is_superuser && (
              <View style={[adminStyles.badge, adminStyles.badgeError]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeErrorText]}>SUPERUSER</Text>
              </View>
            )}
            {user.is_admin && !user.is_superuser && (
              <View style={[adminStyles.badge, adminStyles.badgeWarning]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeWarningText]}>ADMIN</Text>
              </View>
            )}
            <View style={[adminStyles.badge, user.is_active ? adminStyles.badgeSuccess : adminStyles.badgeError]}>
              <Text style={[adminStyles.badgeText, user.is_active ? adminStyles.badgeSuccessText : adminStyles.badgeErrorText]}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            {user.suscrito && (
              <View style={[adminStyles.badge, adminStyles.badgeInfo]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeInfoText]}>Suscrito</Text>
              </View>
            )}
          </View>
        </View>

        {/* Información detallada */}
        <View style={adminStyles.card}>
          <Text style={adminStyles.sectionTitle}>Información</Text>
          <InfoRow label="ID" value={`#${user.id}`} />
          <InfoRow label="Nombre" value={`${user.first_name} ${user.last_name}`} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Consultas restantes" value={String(user.consultas_restantes)} />
          <InfoRow label="Verificado" value={user.is_verified ? 'Sí' : 'No'} />
          <InfoRow label="Registrado" value={formatDate(user.created_at)} />
          <InfoRow label="Último login" value={formatDate(user.last_login)} />
        </View>

        {/* Acciones */}
        <View style={adminStyles.card}>
          <Text style={adminStyles.sectionTitle}>Acciones</Text>

          {/* Resetear contraseña */}
          <TouchableOpacity
            style={[adminStyles.button, { marginBottom: 12 }]}
            onPress={() => { setActionError(''); setResetPasswordModal(true); }}
          >
            <MaterialCommunityIcons name="lock-reset" size={20} color={AdminColors.white} />
            <Text style={adminStyles.buttonText}>Resetear Contraseña</Text>
          </TouchableOpacity>

          {/* Promover a superuser */}
          {!user.is_superuser && (
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSuccess, { marginBottom: 12 }]}
              onPress={() => { setActionError(''); setPromoteModal(true); }}
            >
              <MaterialCommunityIcons name="shield-crown" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>Promover a Superusuario</Text>
            </TouchableOpacity>
          )}

          {/* Desactivar usuario */}
          {user.is_active && (
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonDanger]}
              onPress={() => { setActionError(''); setDeleteModal(true); }}
            >
              <MaterialCommunityIcons name="account-off" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>Desactivar Usuario</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal: Resetear contraseña */}
      <Modal visible={resetPasswordModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={adminStyles.modalOverlay}>
          <View style={adminStyles.modalContent}>
            <View style={adminStyles.modalHeader}>
              <Text style={adminStyles.modalTitle}>Resetear Contraseña</Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color={AdminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={adminStyles.modalBody}>
              <Text style={{ color: AdminColors.textSecondary, marginBottom: 16 }}>
                Establece una nueva contraseña para {user.first_name} ({user.email})
              </Text>

              <Text style={adminStyles.inputLabel}>Nueva contraseña</Text>
              <TextInput
                style={adminStyles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={AdminColors.gray400}
              />

              <Text style={[adminStyles.inputLabel, { marginTop: 12 }]}>Confirmar contraseña</Text>
              <TextInput
                style={adminStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Repite la contraseña"
                placeholderTextColor={AdminColors.gray400}
              />

              {actionError ? (
                <Text style={[adminStyles.inputErrorText, { marginTop: 8 }]}>{actionError}</Text>
              ) : null}
            </View>

            <View style={adminStyles.modalFooter}>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonSecondary]}
                onPress={closeModal}
              >
                <Text style={adminStyles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[adminStyles.button, actionLoading && adminStyles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={AdminColors.white} />
                ) : (
                  <Text style={adminStyles.buttonText}>Resetear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Promover a superusuario */}
      <Modal visible={promoteModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={adminStyles.modalOverlay}>
          <View style={adminStyles.modalContent}>
            <View style={adminStyles.modalHeader}>
              <Text style={adminStyles.modalTitle}>Promover a Superusuario</Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color={AdminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={adminStyles.modalBody}>
              <View style={{ backgroundColor: AdminColors.warningLight, padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: AdminColors.warning, fontWeight: '600', marginBottom: 4 }}>
                  Acción irreversible
                </Text>
                <Text style={{ color: AdminColors.textSecondary }}>
                  Vas a otorgar privilegios de superusuario a {user.first_name} {user.last_name} ({user.email}).
                  Tendrá acceso total al panel de administración.
                </Text>
              </View>

              <Text style={adminStyles.inputLabel}>Tu contraseña para confirmar</Text>
              <TextInput
                style={adminStyles.input}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={AdminColors.gray400}
              />

              {actionError ? (
                <Text style={[adminStyles.inputErrorText, { marginTop: 8 }]}>{actionError}</Text>
              ) : null}
            </View>

            <View style={adminStyles.modalFooter}>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonSecondary]}
                onPress={closeModal}
              >
                <Text style={adminStyles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonSuccess, actionLoading && adminStyles.buttonDisabled]}
                onPress={handlePromote}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={AdminColors.white} />
                ) : (
                  <Text style={adminStyles.buttonText}>Promover</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Desactivar usuario */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={adminStyles.modalOverlay}>
          <View style={adminStyles.modalContent}>
            <View style={adminStyles.modalHeader}>
              <Text style={adminStyles.modalTitle}>Desactivar Usuario</Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color={AdminColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={adminStyles.modalBody}>
              <View style={{ backgroundColor: AdminColors.errorLight, padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: AdminColors.error, fontWeight: '600', marginBottom: 4 }}>
                  Desactivar cuenta
                </Text>
                <Text style={{ color: AdminColors.textSecondary }}>
                  El usuario {user.first_name} {user.last_name} ({user.email}) será desactivado
                  y no podrá iniciar sesión. Esta acción se puede revertir.
                </Text>
              </View>

              {actionError ? (
                <Text style={[adminStyles.inputErrorText, { marginTop: 8 }]}>{actionError}</Text>
              ) : null}
            </View>

            <View style={adminStyles.modalFooter}>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonSecondary]}
                onPress={closeModal}
              >
                <Text style={adminStyles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonDanger, actionLoading && adminStyles.buttonDisabled]}
                onPress={handleDeactivate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={AdminColors.white} />
                ) : (
                  <Text style={adminStyles.buttonText}>Desactivar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
      <Text style={{ fontSize: 14, color: AdminColors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: AdminColors.textPrimary }}>{value}</Text>
    </View>
  );
}
