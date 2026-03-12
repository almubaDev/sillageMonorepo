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
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguageChange } from '../../hooks/useLanguageChange';

interface Props {
  navigation: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { login } = useAuthContext();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;

  // Limpiar errores cuando cambia el idioma
  useLanguageChange(() => {
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');
  });

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');
    setErrorMessage('');

    if (text && !text.includes('@')) {
      setEmailError(t('auth:login.errors.emailInvalid'));
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setPasswordError('');
    setErrorMessage('');

    if (text && text.length < 6) {
      setPasswordError(t('auth:login.errors.passwordMinLength', { count: 6 }));
    }
  };

  const handleLogin = async () => {
    // Limpiar errores previos
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    // Validaciones
    let hasError = false;

    if (!email.trim()) {
      setEmailError(t('auth:login.errors.emailRequired'));
      hasError = true;
    } else if (!email.includes('@')) {
      setEmailError(t('auth:login.errors.emailInvalid'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth:login.errors.passwordRequired'));
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(t('auth:login.errors.passwordMinLength', { count: 6 }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    const result = await login({ username: email.trim(), password });
    setLoading(false);

    if (!result.success) {
      // Mensajes de error más específicos
      const errorMsg = result.error || t('auth:login.errors.loginFailed');

      if (errorMsg.toLowerCase().includes('incorrectos') || errorMsg.toLowerCase().includes('incorrect')) {
        setErrorMessage(t('auth:login.errors.invalidCredentials'));
      } else if (errorMsg.toLowerCase().includes('inactivo') || errorMsg.toLowerCase().includes('inactive')) {
        setErrorMessage(t('auth:login.errors.inactiveAccount'));
      } else if (errorMsg.toLowerCase().includes('conexión') || errorMsg.toLowerCase().includes('connection')) {
        setErrorMessage(t('auth:login.errors.connectionError'));
      } else {
        setErrorMessage(errorMsg);
      }
    }
  };

  const VideoModal = () => (
    <Modal
      visible={showVideoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowVideoModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowVideoModal(false)}
      >
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowVideoModal(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.videoContainer, isDesktop && styles.videoContainerDesktop]}>
            {Platform.OS === 'web' ? (
              <iframe
                src="https://www.youtube.com/embed/xyW51z5uhPs?autoplay=1"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 } as any}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (isWeb && isDesktop) {
    // DISEÑO WEB DESKTOP (2 COLUMNAS)
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.bg }]}>
        <LanguageSelector position="top-right" />
        <VideoModal />
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
              {t('auth:login.tagline')}
            </Text>
            <Text style={[styles.webBrandDescription, { color: colors.bg, opacity: 0.9 }]}>
              {t('auth:login.description')}
            </Text>
            <TouchableOpacity
              style={styles.aboutUsButton}
              onPress={() => setShowVideoModal(true)}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={20} color={colors.bg} />
              <Text style={[styles.aboutUsButtonText, { color: colors.bg }]}>
                {t('auth:login.aboutUs')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* COLUMNA DERECHA - FORMULARIO */}
        <ScrollView
          contentContainerStyle={styles.formSection}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={[styles.webFormTitle, { color: colors.text }]}>{t('auth:login.title')}</Text>
            <Text style={[styles.webFormSubtitle, { color: colors.secondary }]}>
              {t('auth:login.subtitle')}
            </Text>

            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: '#EF444410', borderColor: '#EF4444' }]}>
                <Text style={[styles.errorText, { color: '#EF4444' }]}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.webForm}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth:login.email')}</Text>
                <TextInput
                  style={[
                    styles.webInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: emailError ? '#EF4444' : colors.accent,
                    },
                  ]}
                  placeholder={t('auth:login.emailPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={email}
                  onChangeText={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? (
                  <Text style={[styles.fieldError, { color: '#EF4444' }]}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth:login.password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.webInput,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: passwordError ? '#EF4444' : colors.accent,
                      },
                    ]}
                    placeholder={t('auth:login.passwordPlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={password}
                    onChangeText={validatePassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={[styles.fieldError, { color: '#EF4444' }]}>{passwordError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                  {t('auth:login.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.webButton, { backgroundColor: colors.accent }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.bg }]}>
                    {t('auth:login.loginButton')}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.dividerText, { color: colors.secondary }]}>{t('common:or')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
              </View>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.accent }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                  {t('auth:login.createAccount')}
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
      <LanguageSelector position="top-right" />
      <VideoModal />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.aboutUsMobile}
              onPress={() => setShowVideoModal(true)}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={14} color={colors.accent} />
              <Text style={[styles.aboutUsMobileText, { color: colors.accent }]}>
                {t('auth:login.aboutUs')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('auth:login.welcome')}</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('auth:login.tagline')}
          </Text>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: '#EF444410', borderColor: '#EF4444' }]}>
              <Text style={[styles.errorText, { color: '#EF4444' }]}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:login.email')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: emailError ? '#EF4444' : colors.accent,
                  },
                ]}
                placeholder={t('auth:login.emailPlaceholder')}
                placeholderTextColor={colors.secondary}
                value={email}
                onChangeText={validateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:login.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: passwordError ? '#EF4444' : colors.accent,
                    },
                  ]}
                  placeholder={t('auth:login.passwordPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                {t('auth:login.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg }]}>
                  {t('auth:login.loginButton')}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.dividerText, { color: colors.secondary }]}>{t('common:or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.secondary }]} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.accent }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                {t('auth:login.createAccount')}
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
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
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
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },

  // Botón Conócenos - Web
  aboutUsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    gap: 8,
  },
  aboutUsButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Botón Conócenos - Mobile (sutil)
  aboutUsMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aboutUsMobileText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Modal de video
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 10,
    padding: 8,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoContainerDesktop: {
    maxWidth: 360,
  },
});