import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';

export const ProfileScreen = () => {
  const { colors, cyclePalette } = useTheme();
  const { user, logout } = useAuthContext();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* Header con nombre de usuario */}
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={[styles.email, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {user?.email}
        </Text>
      </View>

      {/* Cards de info */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <View style={[styles.statCard, { backgroundColor: colors.accent + '15', borderLeftColor: colors.accent }]}>
          <MaterialCommunityIcons 
            name={user?.suscrito ? "check-circle" : "close-circle"} 
            size={24} 
            color={colors.accent} 
          />
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              Suscripción
            </Text>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {user?.suscrito ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.accent + '15', borderLeftColor: colors.accent }]}>
          <MaterialCommunityIcons name="counter" size={24} color={colors.accent} />
          <View style={styles.statInfo}>
            <Text style={[styles.statLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              Consultas
            </Text>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {user?.consultas_restantes || 0} restantes
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={cyclePalette}
        >
          <MaterialCommunityIcons name="palette" size={22} color={colors.bg} />
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            Cambiar Tema
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.secondary }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color={colors.secondary} />
          <Text style={[styles.buttonText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  name: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  statsGridDesktop: {
    flexDirection: 'row',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 15,
  },
});