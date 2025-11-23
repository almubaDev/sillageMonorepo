/**
 * APIUsageScreen - Monitoreo de uso de APIs externas
 * Muestra consumo de Gemini, OpenWeather y Google Maps
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Switch, RefreshControl, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, APIUsageSummary, APIConfigInfo } from '../../services/adminService';

// URLs de los servicios de API
const API_URLS = {
  gemini: 'https://aistudio.google.com/',
  openweather: 'https://openweathermap.org/api',
  google_maps: 'https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com',
};

// Costos por API (para calcular estimados)
const API_COSTS = {
  gemini: {
    costPer1MTokensInput: 0.10,
    costPer1MTokensOutput: 0.40,
    costPerCall: 0,
    limitType: 'llamadas', // El límite es por llamadas, no tokens
  },
  openweather: {
    costPerCall: 0.0015,
    limitType: 'llamadas',
  },
  google_maps: {
    costPerCall: 0.005,
    limitType: 'llamadas',
  },
};

// Límites por tier
const API_LIMITS = {
  gemini: {
    free: { daily: 200, monthly: 6000 },
    paid: { daily: 10000, monthly: 300000 },
  },
  openweather: {
    free: { daily: 1000, monthly: 30000 },
    paid: { daily: 100000, monthly: 3000000 },
  },
  google_maps: {
    free: { daily: 0, monthly: 10000 },
    paid: { daily: 0, monthly: 1000000 },
  },
};

interface APICardProps {
  name: string;
  displayName: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  data: APIUsageSummary[keyof APIUsageSummary] | undefined;
  config: APIConfigInfo | undefined;
  onToggleTier: (apiName: string, isPaid: boolean) => void;
  url: string;
}

function APICard({ name, displayName, icon, iconColor, data, config, onToggleTier, url }: APICardProps) {
  if (!data) return null;

  const handleTitlePress = () => {
    Linking.openURL(url);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return AdminColors.error;
    if (percentage >= 80) return AdminColors.warning;
    return AdminColors.success;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es').format(num);
  };

  // Calcular costo estimado basado en uso
  const calculateCost = (calls: number, tokensInput: number = 0, tokensOutput: number = 0): number => {
    const costs = API_COSTS[name as keyof typeof API_COSTS];
    if (!costs) return 0;

    if (name === 'gemini') {
      const geminiCosts = costs as typeof API_COSTS.gemini;
      const inputCost = (tokensInput / 1000000) * geminiCosts.costPer1MTokensInput;
      const outputCost = (tokensOutput / 1000000) * geminiCosts.costPer1MTokensOutput;
      return inputCost + outputCost;
    } else {
      const apiCosts = costs as { costPerCall: number };
      return calls * apiCosts.costPerCall;
    }
  };

  const getLimitType = (): string => {
    const costs = API_COSTS[name as keyof typeof API_COSTS];
    return costs?.limitType || 'llamadas';
  };

  const todayCost = calculateCost(
    data.today.calls,
    data.today.tokens_input || 0,
    data.today.tokens_output || 0
  );

  const monthCost = calculateCost(
    data.month.calls,
    data.month.tokens_input || 0,
    data.month.tokens_output || 0
  );

  const limitType = getLimitType();

  return (
    <View style={[adminStyles.card, { marginBottom: 16 }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={[adminStyles.menuItemIcon, { backgroundColor: `${iconColor}15` }]}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={[adminStyles.cardTitle, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            onPress={handleTitlePress}
          >
            {displayName}
          </Text>
          <Text style={adminStyles.cardSubtitle}>
            {data.is_paid_tier ? 'Modo Pago' : 'Free Tier'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Switch
            value={data.is_paid_tier}
            onValueChange={(value) => onToggleTier(name, value)}
            trackColor={{ false: AdminColors.gray300, true: `${AdminColors.primary}80` }}
            thumbColor={data.is_paid_tier ? AdminColors.primary : AdminColors.gray400}
          />
          <Text style={{ fontSize: 10, color: AdminColors.textSecondary, marginTop: 2 }}>
            {data.is_paid_tier ? 'Paid' : 'Free'}
          </Text>
        </View>
      </View>

      {/* Alertas */}
      {data.alerts && data.alerts.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          {data.alerts.map((alert, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: alert.level === 'critical' ? '#FEE2E2' : '#FEF3C7',
                padding: 8,
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <MaterialCommunityIcons
                name={alert.level === 'critical' ? 'alert-circle' : 'alert'}
                size={16}
                color={alert.level === 'critical' ? AdminColors.error : AdminColors.warning}
              />
              <Text style={{ marginLeft: 8, fontSize: 12, color: AdminColors.textPrimary }}>
                {alert.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Uso Diario */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={adminStyles.label}>Uso Hoy</Text>
          <Text style={adminStyles.value}>
            {formatNumber(data.today.calls)} / {formatNumber(data.today.limit)}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: AdminColors.gray200, borderRadius: 4, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${Math.min(data.today.percentage, 100)}%`,
              backgroundColor: getProgressColor(data.today.percentage),
              borderRadius: 4,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: AdminColors.textSecondary }}>
            {data.today.percentage.toFixed(1)}% del límite de {limitType} diario
          </Text>
          <Text style={{ fontSize: 11, color: data.is_paid_tier ? AdminColors.error : AdminColors.textSecondary }}>
            {data.is_paid_tier ? `$${todayCost.toFixed(4)} USD` : '$0.00 (Free)'}
          </Text>
        </View>
      </View>

      {/* Uso Mensual */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={adminStyles.label}>Uso Este Mes</Text>
          <Text style={adminStyles.value}>
            {formatNumber(data.month.calls)} / {formatNumber(data.month.limit)}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: AdminColors.gray200, borderRadius: 4, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${Math.min(data.month.percentage, 100)}%`,
              backgroundColor: getProgressColor(data.month.percentage),
              borderRadius: 4,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: AdminColors.textSecondary }}>
            {data.month.percentage.toFixed(1)}% del límite de {limitType} mensual
          </Text>
          <Text style={{ fontSize: 11, color: data.is_paid_tier ? AdminColors.error : AdminColors.textSecondary }}>
            {data.is_paid_tier ? `$${monthCost.toFixed(4)} USD` : '$0.00 (Free)'}
          </Text>
        </View>
      </View>

      {/* Tokens (solo para Gemini) */}
      {name === 'gemini' && (
        <View style={{ borderTopWidth: 1, borderTopColor: AdminColors.border, paddingTop: 12 }}>
          <Text style={[adminStyles.label, { marginBottom: 8 }]}>Tokens Consumidos</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={adminStyles.statsCardValue}>{formatNumber(data.today.tokens_input || 0)}</Text>
              <Text style={adminStyles.statsCardLabel}>Input Hoy</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={adminStyles.statsCardValue}>{formatNumber(data.today.tokens_output || 0)}</Text>
              <Text style={adminStyles.statsCardLabel}>Output Hoy</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={adminStyles.statsCardValue}>{formatNumber(data.month.tokens_input || 0)}</Text>
              <Text style={adminStyles.statsCardLabel}>Input Mes</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={adminStyles.statsCardValue}>{formatNumber(data.month.tokens_output || 0)}</Text>
              <Text style={adminStyles.statsCardLabel}>Output Mes</Text>
            </View>
          </View>
        </View>
      )}

      {/* Costo estimado (solo en modo Paid y si hay uso) */}
      {data.is_paid_tier && data.month.calls > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: AdminColors.border, paddingTop: 12, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={adminStyles.label}>Costo Estimado (Mes)</Text>
            <Text style={[adminStyles.value, { color: AdminColors.error }]}>
              ${monthCost.toFixed(4)} USD
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function APIUsageScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<APIUsageSummary | null>(null);
  const [configs, setConfigs] = useState<APIConfigInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, configsData] = await Promise.all([
        adminService.getAPIUsageSummary(),
        adminService.getAPIConfigs(),
      ]);
      setSummary(summaryData);
      setConfigs(configsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar datos de uso de APIs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleTier = async (apiName: string, isPaid: boolean) => {
    try {
      await adminService.setAPITierMode(apiName, isPaid);
      await loadData(); // Recargar datos
    } catch (err: any) {
      console.error('Error al cambiar tier:', err);
    }
  };

  const getConfig = (apiName: string) => configs.find(c => c.api_name === apiName);

  if (loading) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando uso de APIs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={adminStyles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={AdminColors.error} />
        <Text style={[adminStyles.pageSubtitle, { marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity
          style={[adminStyles.button, { marginTop: 16 }]}
          onPress={loadData}
        >
          <Text style={adminStyles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={adminStyles.pageHeader}>
          <Text style={adminStyles.pageTitle}>Uso de APIs Externas</Text>
          <Text style={adminStyles.pageSubtitle}>
            Monitoreo de consumo vs. limites del free tier
          </Text>
        </View>

        {/* Info Card */}
        <View style={[adminStyles.card, { backgroundColor: '#EFF6FF', marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
            <Text style={{ marginLeft: 8, color: '#1E40AF', fontSize: 13 }}>
              Activa el switch "Paid" cuando cambies a plan de pago para calcular costos reales.
            </Text>
          </View>
        </View>

        {/* API Cards */}
        <APICard
          name="gemini"
          displayName="Google Gemini 2.0 Flash"
          icon="robot"
          iconColor="#4285F4"
          data={summary?.gemini}
          config={getConfig('gemini')}
          onToggleTier={handleToggleTier}
          url={API_URLS.gemini}
        />

        <APICard
          name="openweather"
          displayName="OpenWeather API"
          icon="weather-cloudy"
          iconColor="#EB6E4B"
          data={summary?.openweather}
          config={getConfig('openweather')}
          onToggleTier={handleToggleTier}
          url={API_URLS.openweather}
        />

        <APICard
          name="google_maps"
          displayName="Google Maps Geocoding"
          icon="map-marker"
          iconColor="#34A853"
          data={summary?.google_maps}
          config={getConfig('google_maps')}
          onToggleTier={handleToggleTier}
          url={API_URLS.google_maps}
        />

        {/* Limites Reference - Dinámico según tier */}
        <View style={[adminStyles.card, { marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={adminStyles.cardTitle}>Referencia de Límites</Text>
          </View>

          {/* Gemini */}
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={adminStyles.label}>Gemini 2.0 Flash</Text>
                <View style={{
                  marginLeft: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: summary?.gemini?.is_paid_tier ? '#DBEAFE' : '#D1FAE5',
                }}>
                  <Text style={{ fontSize: 10, color: summary?.gemini?.is_paid_tier ? '#1D4ED8' : '#059669' }}>
                    {summary?.gemini?.is_paid_tier ? 'PAID' : 'FREE'}
                  </Text>
                </View>
              </View>
              <Text style={adminStyles.value}>
                {summary?.gemini?.is_paid_tier
                  ? `${(API_LIMITS.gemini.paid.daily).toLocaleString()}/día, ${(API_LIMITS.gemini.paid.monthly).toLocaleString()}/mes`
                  : `${API_LIMITS.gemini.free.daily}/día, ${(API_LIMITS.gemini.free.monthly).toLocaleString()}/mes`
                }
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: AdminColors.textSecondary, marginTop: 2 }}>
              {summary?.gemini?.is_paid_tier ? '$0.10/1M input + $0.40/1M output' : 'Sin costo'}
            </Text>
          </View>

          {/* OpenWeather */}
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={adminStyles.label}>OpenWeather</Text>
                <View style={{
                  marginLeft: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: summary?.openweather?.is_paid_tier ? '#DBEAFE' : '#D1FAE5',
                }}>
                  <Text style={{ fontSize: 10, color: summary?.openweather?.is_paid_tier ? '#1D4ED8' : '#059669' }}>
                    {summary?.openweather?.is_paid_tier ? 'PAID' : 'FREE'}
                  </Text>
                </View>
              </View>
              <Text style={adminStyles.value}>
                {summary?.openweather?.is_paid_tier
                  ? `${(API_LIMITS.openweather.paid.daily).toLocaleString()}/día, ${(API_LIMITS.openweather.paid.monthly).toLocaleString()}/mes`
                  : `${(API_LIMITS.openweather.free.daily).toLocaleString()}/día, ${(API_LIMITS.openweather.free.monthly).toLocaleString()}/mes`
                }
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: AdminColors.textSecondary, marginTop: 2 }}>
              {summary?.openweather?.is_paid_tier ? '$0.0015/llamada' : 'Sin costo'}
            </Text>
          </View>

          {/* Google Maps */}
          <View style={{ paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={adminStyles.label}>Google Maps</Text>
                <View style={{
                  marginLeft: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: summary?.google_maps?.is_paid_tier ? '#DBEAFE' : '#D1FAE5',
                }}>
                  <Text style={{ fontSize: 10, color: summary?.google_maps?.is_paid_tier ? '#1D4ED8' : '#059669' }}>
                    {summary?.google_maps?.is_paid_tier ? 'PAID' : 'FREE'}
                  </Text>
                </View>
              </View>
              <Text style={adminStyles.value}>
                {summary?.google_maps?.is_paid_tier
                  ? `Sin límite diario, ${(API_LIMITS.google_maps.paid.monthly).toLocaleString()}/mes`
                  : `Sin límite diario, ${(API_LIMITS.google_maps.free.monthly).toLocaleString()}/mes`
                }
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: AdminColors.textSecondary, marginTop: 2 }}>
              {summary?.google_maps?.is_paid_tier ? '$0.005/llamada ($5/1000)' : 'Sin costo'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
