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
} from '../../services/adminService';

export default function FinancialReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [packageRevenue, setPackageRevenue] = useState<PackageRevenue[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
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
      const [summaryData, revenueData, customersData] = await Promise.all([
        adminService.getFinancialSummary(),
        adminService.getRevenueByPackage(period),
        adminService.getTopCustomers(10),
      ]);

      setSummary(summaryData);
      setPackageRevenue(revenueData);
      setTopCustomers(customersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

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
        {/* Resumen General */}
        <Text style={adminStyles.sectionTitle}>Resumen General</Text>
        <View style={adminStyles.grid2}>
          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={32}
              color={AdminColors.success}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>
              {formatCurrency(summary?.total_revenue || 0)}
            </Text>
            <Text style={adminStyles.statsCardLabel}>Total Histórico</Text>
          </View>

          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={32}
              color={AdminColors.primary}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>
              {formatCurrency(summary?.monthly_revenue || 0)}
            </Text>
            <Text style={adminStyles.statsCardLabel}>Este Mes</Text>
          </View>

          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={32}
              color={AdminColors.info}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>
              {formatCurrency(summary?.daily_revenue || 0)}
            </Text>
            <Text style={adminStyles.statsCardLabel}>Hoy</Text>
          </View>

          <View style={[adminStyles.statsCard, adminStyles.gridItem2]}>
            <MaterialCommunityIcons
              name="receipt"
              size={32}
              color={AdminColors.warning}
              style={adminStyles.statsCardIcon}
            />
            <Text style={adminStyles.statsCardValue}>{summary?.total_transactions || 0}</Text>
            <Text style={adminStyles.statsCardLabel}>Transacciones</Text>
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
