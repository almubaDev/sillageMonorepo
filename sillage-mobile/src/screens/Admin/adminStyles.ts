/**
 * Estilos independientes para el panel administrativo
 * Paleta corporativa: grises, azules, sin usar ThemeProvider
 */
import { StyleSheet } from 'react-native';

// ==================== COLORES ====================
export const AdminColors = {
  // Primarios
  primary: '#3B82F6',      // Azul primario
  primaryDark: '#2563EB',  // Azul oscuro
  primaryLight: '#DBEAFE', // Azul claro

  // Grises
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semánticos
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Fondos
  white: '#FFFFFF',
  background: '#F9FAFB',
  cardBg: '#FFFFFF',

  // Bordes
  border: '#E5E7EB',
  borderDark: '#D1D5DB',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textWhite: '#FFFFFF',
};

// ==================== ESTILOS GLOBALES ====================
export const adminStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: AdminColors.background,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AdminColors.background,
  },

  // Cards
  card: {
    backgroundColor: AdminColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AdminColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AdminColors.textPrimary,
  },

  cardSubtitle: {
    fontSize: 14,
    color: AdminColors.textSecondary,
    marginTop: 4,
  },

  // Headers
  pageHeader: {
    backgroundColor: AdminColors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AdminColors.textPrimary,
    marginBottom: 8,
  },

  pageSubtitle: {
    fontSize: 16,
    color: AdminColors.textSecondary,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AdminColors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },

  // Botones
  button: {
    backgroundColor: AdminColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  buttonText: {
    color: AdminColors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  buttonSecondary: {
    backgroundColor: AdminColors.gray200,
  },

  buttonSecondaryText: {
    color: AdminColors.textPrimary,
  },

  buttonDanger: {
    backgroundColor: AdminColors.error,
  },

  buttonSuccess: {
    backgroundColor: AdminColors.success,
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AdminColors.primary,
  },

  buttonOutlineText: {
    color: AdminColors.primary,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  // Inputs
  input: {
    backgroundColor: AdminColors.white,
    borderWidth: 1,
    borderColor: AdminColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: AdminColors.textPrimary,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AdminColors.textPrimary,
    marginBottom: 8,
  },

  inputError: {
    borderColor: AdminColors.error,
  },

  inputErrorText: {
    fontSize: 12,
    color: AdminColors.error,
    marginTop: 4,
  },

  // Badges
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  badgeSuccess: {
    backgroundColor: AdminColors.successLight,
  },

  badgeSuccessText: {
    color: AdminColors.success,
  },

  badgeWarning: {
    backgroundColor: AdminColors.warningLight,
  },

  badgeWarningText: {
    color: AdminColors.warning,
  },

  badgeError: {
    backgroundColor: AdminColors.errorLight,
  },

  badgeErrorText: {
    color: AdminColors.error,
  },

  badgeInfo: {
    backgroundColor: AdminColors.infoLight,
  },

  badgeInfoText: {
    color: AdminColors.info,
  },

  // Stats Cards
  statsCard: {
    backgroundColor: AdminColors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AdminColors.border,
    minHeight: 120,
  },

  statsCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AdminColors.textPrimary,
    marginBottom: 4,
  },

  statsCardLabel: {
    fontSize: 14,
    color: AdminColors.textSecondary,
    marginBottom: 12,
  },

  statsCardIcon: {
    marginBottom: 8,
  },

  // Tables
  table: {
    backgroundColor: AdminColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AdminColors.border,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: AdminColors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: AdminColors.textPrimary,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  tableCell: {
    fontSize: 14,
    color: AdminColors.textPrimary,
  },

  tableCellSecondary: {
    color: AdminColors.textSecondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AdminColors.background,
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: AdminColors.textSecondary,
  },

  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 16,
    color: AdminColors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: AdminColors.border,
    marginVertical: 16,
  },

  // Grid
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  gridItem2: {
    width: '48%',
  },

  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  gridItem3: {
    width: '31%',
  },

  // Menu Item
  menuItem: {
    backgroundColor: AdminColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AdminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AdminColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuItemContent: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AdminColors.textPrimary,
    marginBottom: 4,
  },

  menuItemDescription: {
    fontSize: 14,
    color: AdminColors.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: AdminColors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AdminColors.textPrimary,
  },

  modalBody: {
    marginBottom: 20,
  },

  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
