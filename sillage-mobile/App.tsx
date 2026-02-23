import 'react-native-gesture-handler'; // Debe ser la primera importación
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/utils/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initI18n } from './src/i18n';
import './src/i18n'; // Importar para inicializar

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    async function loadResources() {
      // Cargar fuentes e i18n en paralelo
      await Promise.all([
        Font.loadAsync({
          'AlanSans-Regular': require('./assets/fonts/AlanSans-Regular.ttf'),
          'AlanSans-Bold': require('./assets/fonts/AlanSans-Bold.ttf'),
          'Lato-Regular': require('./assets/fonts/Lato-Regular.ttf'),
          'Lato-Bold': require('./assets/fonts/Lato-Bold.ttf'),
          'Lato-Italic': require('./assets/fonts/Lato-Italic.ttf'),
        }),
        initI18n(),
      ]);

      setFontsLoaded(true);
      setI18nInitialized(true);
    }

    loadResources();
  }, []);

  if (!fontsLoaded || !i18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const linking: LinkingOptions<any> = {
    prefixes: [Platform.OS === 'web' ? window.location.origin : 'sillage://'],
    config: {
      screens: {
        ResetPassword: {
          path: 'reset-password',
          parse: {
            token: (token: string) => token,
            email: (email: string) => decodeURIComponent(email),
          },
        },
        Perfil: {
          screens: {
            PaymentSuccess: {
              path: 'payment/success',
              parse: {
                ref: (ref: string) => ref,
                source: (source: string) => source,
                status: (status: string) => status,
              },
            },
            PaymentCancel: {
              path: 'payment/cancel',
              parse: {
                ref: (ref: string) => ref,
              },
            },
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}