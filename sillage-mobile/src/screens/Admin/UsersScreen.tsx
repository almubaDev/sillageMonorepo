/**
 * UsersScreen - Gestión de usuarios (versión simplificada)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, AdminUser } from '../../services/adminService';
import { AdminStackParamList } from './AdminScreen';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

export default function UsersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadCollection = async (user: AdminUser) => {
    try {
      setDownloadingId(user.id);
      const csvData = await adminService.exportUserCollectionCsv(user.id);
      const filename = `coleccion_${user.first_name}_${user.last_name}_${user.id}.csv`;

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al descargar colección';
      Alert.alert('Error', msg);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listUsers({ search, limit: 50 });
      setUsers(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      <View style={{ padding: 20, backgroundColor: AdminColors.white, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
        <TextInput
          style={adminStyles.input}
          placeholder="Buscar por email o nombre..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={AdminColors.gray400}
        />
      </View>

      <ScrollView style={adminStyles.scrollContainer} contentContainerStyle={adminStyles.scrollContent}>
        {error && (
          <View style={adminStyles.card}>
            <Text style={{ color: AdminColors.error }}>{error}</Text>
          </View>
        )}

        {users.length === 0 && !loading && (
          <View style={adminStyles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color={AdminColors.gray300} />
            <Text style={adminStyles.emptyText}>No se encontraron usuarios</Text>
          </View>
        )}

        {users.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={adminStyles.card}
            onPress={() => navigation.navigate('UserDetail', { userId: user.id })}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                <Text style={adminStyles.cardTitle}>{user.first_name} {user.last_name}</Text>
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
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AdminColors.gray400} />
            </View>
            <Text style={adminStyles.cardSubtitle}>{user.email}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
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
              <View style={[adminStyles.badge, { backgroundColor: AdminColors.gray100 }]}>
                <Text style={[adminStyles.badgeText, { color: AdminColors.textPrimary }]}>
                  {user.consultas_restantes} consultas
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: AdminColors.primary + '10', borderRadius: 6, alignSelf: 'flex-start' }}
              onPress={(e) => { e.stopPropagation(); handleDownloadCollection(user); }}
              disabled={downloadingId === user.id}
            >
              {downloadingId === user.id ? (
                <ActivityIndicator size="small" color={AdminColors.primary} />
              ) : (
                <MaterialCommunityIcons name="download" size={16} color={AdminColors.primary} />
              )}
              <Text style={{ fontSize: 12, color: AdminColors.primary, fontWeight: '500' }}>
                Descargar colección
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
