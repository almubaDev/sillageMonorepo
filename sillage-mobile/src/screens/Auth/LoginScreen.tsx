import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuthContext();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    const result = await login({ username: email, password });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Error al iniciar sesión');
    }
  };

  if (isWeb && isDesktop) {
    // DISEÑO WEB DESKTOP (2 COLUMNAS)
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.bg }]}>
        {/* COLUMNA IZQUIERDA - BRANDING */}
        <View style={[styles.brandingSection, { backgroundColor: colors.accent }]}>
          <View style={styles.brandingContent}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.webLogo}
              resizeMode="contain"
            />
            <Text style={[styles.webBrandTitle, { color: colors.bg }]}>Sillage</Text>
            <Text style={[styles.webBrandSubtitle, { color: colors.bg }]}>
              Tu esencia también habla por ti
            </Text>
            <Text style={[styles.webBrandDescription, { color: colors.bg, opacity: 0.9 }]}>
              Descubre el perfume perfecto para cada momento con inteligencia artificial
            </Text>
          </View>
        </View>

        {/* COLUMNA DERECHA - FORMULARIO */}
        <ScrollView
          contentContainerStyle={styles.formSection}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={[styles.webFormTitle, { color: colors.text }]}>Bienvenido de nuevo</Text>
            <Text style={[styles.webFormSubtitle, { color: colors.secondary }]}>
              Ingresa tus credenciales para continuar
            </Text>

            <View style={styles.webForm}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Correo electrónico</Text>
                <TextInput
                  style={[
                    styles.webInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                    },
                  ]}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
                <TextInput
                  style={[
                    styles.webInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.webButton, { backgroundColor: colors.accent }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.bg }]}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.dividerText, { color: colors.secondary }]}>o</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
              </View>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.accent }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                  Crear una cuenta nueva
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // DISEÑO MÓVIL
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Bienvenido</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            Tu esencia también habla por ti
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.accent,
                  },
                ]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.accent,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={colors.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg }]}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.dividerText, { color: colors.secondary }]}>o</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.accent }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                Crear una cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // WEB DESKTOP
  webContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  brandingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  brandingContent: {
    maxWidth: 500,
    alignItems: 'center',
  },
  webLogo: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  webBrandTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  webBrandSubtitle: {
    fontSize: 22,
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  webBrandDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 440,
  },
  webFormTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  webFormSubtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  webForm: {
    width: '100%',
  },
  webInput: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  webButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  // MÓVIL
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});