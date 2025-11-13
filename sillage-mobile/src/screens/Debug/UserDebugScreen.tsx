/**
 * Pantalla de debug para verificar datos del usuario logueado
 * TEMPORAL - Solo para diagnóstico
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { authService, User } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserDebugScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [storageData, setStorageData] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Cargar usuario desde storage
    const userData = await authService.getUserFromStorage();
    setUser(userData);

    // Cargar datos raw del storage
    const userString = await AsyncStorage.getItem('user');
    setStorageData(userString || 'No hay datos en storage');
  };

  const refresh = () => {
    loadData();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>🔍 Debug - Usuario Actual</Text>

        <TouchableOpacity style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>🔄 Actualizar</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos del Usuario:</Text>
          {user ? (
            <>
              <Text style={styles.text}>ID: {user.id}</Text>
              <Text style={styles.text}>Email: {user.email}</Text>
              <Text style={styles.text}>Nombre: {user.first_name} {user.last_name}</Text>
              <Text style={styles.text}>is_active: {String(user.is_active)}</Text>
              <Text style={styles.text}>is_verified: {String(user.is_verified)}</Text>
              <Text style={[styles.text, styles.important]}>
                is_admin: {String(user.is_admin)} {user.is_admin ? '✅' : '❌'}
              </Text>
              <Text style={[styles.text, styles.important]}>
                is_superuser: {String(user.is_superuser)} {user.is_superuser ? '✅' : '❌'}
              </Text>
              <Text style={styles.text}>suscrito: {String(user.suscrito)}</Text>
              <Text style={styles.text}>consultas_restantes: {user.consultas_restantes}</Text>
            </>
          ) : (
            <Text style={styles.error}>❌ No hay usuario logueado</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Storage Raw Data:</Text>
          <Text style={styles.code}>{storageData}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🎯 Diagnóstico:</Text>
          {user ? (
            <>
              {user.is_superuser ? (
                <Text style={styles.success}>
                  ✅ Este usuario ES SUPERUSUARIO - La pestaña Admin DEBERÍA aparecer
                </Text>
              ) : (
                <Text style={styles.error}>
                  ❌ Este usuario NO es superusuario - La pestaña Admin NO aparecerá
                </Text>
              )}

              <Text style={styles.info}>
                {'\n'}Para ver la pestaña Admin, debes iniciar sesión con:
                {'\n'}📧 contacto@forgeapp.cl
              </Text>
            </>
          ) : (
            <Text style={styles.error}>❌ No hay usuario en el storage</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#555',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    fontFamily: 'monospace',
  },
  important: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    color: '#333',
  },
  success: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 4,
  },
  error: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 4,
  },
  info: {
    color: '#3b82f6',
    fontSize: 14,
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
