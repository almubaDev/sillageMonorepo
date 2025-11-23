/**
 * FinancialReportsScreen - Reportes financieros completos
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import {
  adminService,
  FinancialSummary,
  PackageRevenue,
  TopCustomer,
  APIUsageSummary,
} from '../../services/adminService';

// Costos por API (igual que en APIUsageScreen)
const API_COSTS = {
  gemini: { costPer1MTokensInput: 0.10, costPer1MTokensOutput: 0.40 },
  openweather: { costPerCall: 0.0015 },
  google_maps: { costPerCall: 0.005 },
};

export default function FinancialReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [packageRevenue, setPackageRevenue] = useState<PackageRevenue[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [apiUsage, setApiUsage] = useState<APIUsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | 'month' | 'day'>('all');

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [summaryData, revenueData, customersData, apiData] = await Promise.all([
        adminService.getFinancialSummary(),
        adminService.getRevenueByPackage(period),
        adminService.getTopCustomers(10),
        adminService.getAPIUsageSummary(),
      ]);

      setSummary(summaryData);
      setPackageRevenue(revenueData);
      setTopCustomers(customersData);
      setApiUsage(apiData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Calcular gastos de APIs
  const calculateApiCosts = () => {
    if (!apiUsage) return { today: 0, month: 0, total: 0 };

    let todayCost = 0;
    let monthCost = 0;

    // Gemini (cobra por tokens)
    if (apiUsage.gemini?.is_paid_tier) {
      const gemini = apiUsage.gemini;
      todayCost += ((gemini.today.tokens_input || 0) / 1000000) * API_COSTS.gemini.costPer1MTokensInput;
      todayCost += ((gemini.today.tokens_output || 0) / 1000000) * API_COSTS.gemini.costPer1MTokensOutput;
      monthCost += ((gemini.month.tokens_input || 0) / 1000000) * API_COSTS.gemini.costPer1MTokensInput;
      monthCost += ((gemini.month.tokens_output || 0) / 1000000) * API_COSTS.gemini.costPer1MTokensOutput;
    }

    // OpenWeather (cobra por llamada)
    if (apiUsage.openweather?.is_paid_tier) {
      todayCost += apiUsage.openweather.today.calls * API_COSTS.openweather.costPerCall;
      monthCost += apiUsage.openweather.month.calls * API_COSTS.openweather.costPerCall;
    }

    // Google Maps (cobra por llamada)
    if (apiUsage.google_maps?.is_paid_tier) {
      todayCost += apiUsage.google_maps.today.calls * API_COSTS.google_maps.costPerCall;
      monthCost += apiUsage.google_maps.month.calls * API_COSTS.google_maps.costPerCall;
    }

    // Para el total histórico, usamos el mes como aproximación (sin datos históricos completos)
    return { today: todayCost, month: monthCost, total: monthCost };
  };

  const apiCosts = calculateApiCosts();

  if (loading && !summary) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando reportes financieros...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={adminStyles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={AdminColors.error} />
        <Text style={[adminStyles.pageSubtitle, { marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity
          style={[adminStyles.button, { marginTop: 20 }]}
          onPress={loadFinancialData}
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
      >
        {/* Resumen General - 3 columnas: Ingresos, Gastos, Margen */}
        <Text style={adminStyles.sectionTitle}>Resumen General</Text>
        <View style={[adminStyles.card, { padding: 12 }]}>
          {/* Header de columnas */}
          <View style={{ flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <View style={{ flex: 1 }} />
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: AdminColors.success, textAlign: 'center' }}>Ingresos</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: AdminColors.error, textAlign: 'center' }}>Gastos APIs</Text>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: AdminColors.primary, textAlign: 'center' }}>Margen</Text>
          </View>

          {/* Fila: Hoy */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ flex: 1, fontSize: 12, color: AdminColors.textSecondary }}>Hoy</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.success, textAlign: 'center' }}>
              {formatCurrency(summary?.daily_revenue || 0)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.error, textAlign: 'center' }}>
              {formatCurrency(apiCosts.today)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: (summary?.daily_revenue || 0) - apiCosts.today >= 0 ? AdminColors.primary : AdminColors.error, textAlign: 'center' }}>
              {formatCurrency((summary?.daily_revenue || 0) - apiCosts.today)}
            </Text>
          </View>

          {/* Fila: Este Mes */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: AdminColors.gray200 }}>
            <Text style={{ flex: 1, fontSize: 12, color: AdminColors.textSecondary }}>Mes</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.success, textAlign: 'center' }}>
              {formatCurrency(summary?.monthly_revenue || 0)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.error, textAlign: 'center' }}>
              {formatCurrency(apiCosts.month)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: (summary?.monthly_revenue || 0) - apiCosts.month >= 0 ? AdminColors.primary : AdminColors.error, textAlign: 'center' }}>
              {formatCurrency((summary?.monthly_revenue || 0) - apiCosts.month)}
            </Text>
          </View>

          {/* Fila: Total Histórico */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: AdminColors.gray200 }}>
            <Text style={{ flex: 1, fontSize: 12, color: AdminColors.textSecondary }}>Total</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.success, textAlign: 'center' }}>
              {formatCurrency(summary?.total_revenue || 0)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: AdminColors.error, textAlign: 'center' }}>
              {formatCurrency(apiCosts.total)}
            </Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: (summary?.total_revenue || 0) - apiCosts.total >= 0 ? AdminColors.primary : AdminColors.error, textAlign: 'center' }}>
              {formatCurrency((summary?.total_revenue || 0) - apiCosts.total)}
            </Text>
          </View>

          {/* Info adicional */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: AdminColors.border }}>
            <Text style={{ fontSize: 11, color: AdminColors.textSecondary }}>
              {summary?.total_transactions || 0} transacciones
            </Text>
            <Text style={{ fontSize: 11, color: AdminColors.textSecondary }}>
              Ticket prom: {formatCurrency(summary?.avg_ticket || 0)}
            </Text>
          </View>
        </View>

        {/* Filtros de Período */}
        <Text style={adminStyles.sectionTitle}>Ingresos por Paquete</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            style={[
              adminStyles.button,
              { flex: 1 },
              period === 'all' ? null : adminStyles.buttonSecondary,
            ]}
            onPress={() => setPeriod('all')}
          >
            <Text
              style={[
                adminStyles.buttonText,
                period === 'all' ? null : adminStyles.buttonSecondaryText,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminStyles.button,
              { flex: 1 },
              period === 'month' ? null : adminStyles.buttonSecondary,
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                adminStyles.buttonText,
                period === 'month' ? null : adminStyles.buttonSecondaryText,
              ]}
            >
              Este Mes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              adminStyles.button,
              { flex: 1 },
              period === 'day' ? null : adminStyles.buttonSecondary,
            ]}
            onPress={() => setPeriod('day')}
          >
            <Text
              style={[
                adminStyles.buttonText,
                period === 'day' ? null : adminStyles.buttonSecondaryText,
              ]}
            >
              Hoy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ingresos por Paquete */}
        {packageRevenue.map((pkg, index) => (
          <View key={index} style={adminStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={adminStyles.cardTitle}>{pkg.name}</Text>
                <Text style={adminStyles.cardSubtitle}>
                  {pkg.sales_count} ventas • Promedio: {formatCurrency(pkg.avg_per_sale)}
                </Text>
              </View>
              <Text style={[adminStyles.statsCardValue, { fontSize: 24 }]}>
                {formatCurrency(pkg.total_revenue)}
              </Text>
            </View>
          </View>
        ))}

        {packageRevenue.length === 0 && (
          <View style={adminStyles.emptyContainer}>
            <Text style={adminStyles.emptyText}>No hay datos para este período</Text>
          </View>
        )}

        {/* Top 10 Clientes */}
        <Text style={adminStyles.sectionTitle}>Top 10 Clientes</Text>
        <View style={adminStyles.table}>
          <View style={adminStyles.tableHeader}>
            <Text style={[adminStyles.tableHeaderText, { flex: 2 }]}>Cliente</Text>
            <Text style={[adminStyles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>
              Compras
            </Text>
            <Text style={[adminStyles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>
              Total
            </Text>
          </View>
          {topCustomers.map((customer, index) => (
            <View
              key={customer.user_id}
              style={[
                adminStyles.tableRow,
                index === topCustomers.length - 1 && adminStyles.tableRowLast,
              ]}
            >
              <View style={{ flex: 2 }}>
                <Text style={adminStyles.tableCell}>{customer.full_name}</Text>
                <Text style={[adminStyles.tableCell, adminStyles.tableCellSecondary, { fontSize: 12 }]}>
                  {customer.email}
                </Text>
              </View>
              <Text style={[adminStyles.tableCell, { flex: 1, textAlign: 'right' }]}>
                {customer.purchases_count}
              </Text>
              <Text
                style={[
                  adminStyles.tableCell,
                  { flex: 1, textAlign: 'right', fontWeight: '600', color: AdminColors.success },
                ]}
              >
                {formatCurrency(customer.total_spent)}
              </Text>
            </View>
          ))}
        </View>

        {topCustomers.length === 0 && (
          <View style={adminStyles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color={AdminColors.gray300} />
            <Text style={adminStyles.emptyText}>No hay clientes con compras</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
