/**
 * DashboardScreen - Estadísticas generales del sistema
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, DashboardStats } from '../../services/adminService';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={adminStyles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={AdminColors.error} />
        <Text style={[adminStyles.pageSubtitle, { marginTop: 12 }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
      >
        <View style={adminStyles.grid2}>
          {/* Total Usuarios */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={AdminColors.primary}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.total_users || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Total Usuarios</Text>
          </View>

          {/* Usuarios Activos */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="account-check"
              size={32}
              color={AdminColors.success}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.active_users || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Usuarios Activos</Text>
          </View>

          {/* Suscripciones */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="credit-card"
              size={32}
              color="#3B82F6"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.subscribed_users || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Suscripciones</Text>
          </View>

          {/* Perfumes */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="flower"
              size={32}
              color="#EC4899"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.total_perfumes || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Perfumes</Text>
          </View>

          {/* Recomendaciones */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="message-text"
              size={32}
              color="#F59E0B"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.total_recommendations || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Recomendaciones</Text>
          </View>

          {/* Consultas Regaladas */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="gift"
              size={32}
              color="#10B981"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.total_consultations_gifted || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Consultas Regaladas</Text>
          </View>

          {/* Nuevos Este Mes */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="account-plus"
              size={32}
              color="#6366F1"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.new_users_this_month || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Nuevos Este Mes</Text>
          </View>

          {/* Nuevas Suscripciones */}
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="star"
              size={32}
              color="#14B8A6"
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{stats?.new_subscriptions_this_month || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Nuevas Suscripciones</Text>
          </View>
        </View>

        <View style={adminStyles.card}>
          <Text style={adminStyles.cardTitle}>Información del Sistema</Text>
          <Text style={adminStyles.cardSubtitle}>
            Panel administrativo de Sillage. Utiliza el menú para navegar entre las diferentes secciones.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
