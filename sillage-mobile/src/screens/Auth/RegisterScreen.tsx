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
  ScrollView,
  Image,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { TERMS_AND_CONDITIONS } from '../../constants/termsAndConditions';

interface Props {
  navigation: any;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { register } = useAuthContext();
  const { width } = useWindowDimensions();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    terms: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;

  // Limpiar errores cuando cambia el idioma
  useLanguageChange(() => {
    setErrorMessage('');
    setErrors({
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      terms: '',
    });
  });

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'email':
        if (value && !value.includes('@')) {
          error = t('auth:register.errors.emailInvalid');
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          error = t('auth:register.errors.passwordMinLength', { count: 6 });
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          error = t('auth:register.errors.passwordMismatch');
        }
        break;
      case 'first_name':
        if (value && value.length < 2) {
          error = t('auth:register.errors.nameMinLength', { count: 2 });
        }
        break;
      case 'last_name':
        if (value && value.length < 2) {
          error = t('auth:register.errors.nameMinLength', { count: 2 });
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrorMessage('');
    validateField(field, value);

    // Si es confirmPassword, también revalidar cuando se escribe la contraseña
    if (field === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleTermsChange = () => {
    setAcceptedTerms(!acceptedTerms);
    if (errors.terms) {
      setErrors(prev => ({ ...prev, terms: '' }));
    }
  };

  const handleRegister = async () => {
    const { email, password, confirmPassword, first_name, last_name } = formData;

    // Limpiar errores previos
    setErrorMessage('');
    let newErrors = { email: '', password: '', confirmPassword: '', first_name: '', last_name: '', terms: '' };
    let hasError = false;

    // Validar términos y condiciones
    if (!acceptedTerms) {
      newErrors.terms = 'Debes aceptar los términos y condiciones para continuar';
      hasError = true;
    }

    // Validar campos
    if (!first_name.trim()) {
      newErrors.first_name = t('auth:register.errors.firstNameRequired');
      hasError = true;
    } else if (first_name.trim().length < 2) {
      newErrors.first_name = t('auth:register.errors.nameMinLength', { count: 2 });
      hasError = true;
    }

    if (!last_name.trim()) {
      newErrors.last_name = t('auth:register.errors.lastNameRequired');
      hasError = true;
    } else if (last_name.trim().length < 2) {
      newErrors.last_name = t('auth:register.errors.nameMinLength', { count: 2 });
      hasError = true;
    }

    if (!email.trim()) {
      newErrors.email = t('auth:register.errors.emailRequired');
      hasError = true;
    } else if (!email.includes('@')) {
      newErrors.email = t('auth:register.errors.emailInvalid');
      hasError = true;
    }

    if (!password) {
      newErrors.password = t('auth:register.errors.passwordRequired');
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = t('auth:register.errors.passwordMinLength', { count: 6 });
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth:register.errors.confirmPasswordRequired');
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth:register.errors.passwordMismatch');
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    const result = await register({
      email: email.trim(),
      password,
      first_name: first_name.trim(),
      last_name: last_name.trim()
    });
    setLoading(false);

    if (!result.success) {
      const errorMsg = result.error || t('auth:register.errors.registerFailed');

      if (errorMsg.toLowerCase().includes('ya registrado') || errorMsg.toLowerCase().includes('already exists')) {
        setErrorMessage(t('auth:register.errors.emailExists'));
      } else if (errorMsg.toLowerCase().includes('conexión') || errorMsg.toLowerCase().includes('connection')) {
        setErrorMessage(t('auth:register.errors.connectionError'));
      } else {
        setErrorMessage(errorMsg);
      }
    }
  };

  if (isWeb && isDesktop) {
    // DISEÑO WEB DESKTOP (2 COLUMNAS)
    return (
      <View style={[styles.webContainer, { backgroundColor: colors.bg }]}>
        <LanguageSelector position="top-right" />
        {/* COLUMNA IZQUIERDA - BRANDING */}
        <View style={[styles.brandingSection, { backgroundColor: colors.accent }]}>
          <View style={styles.brandingContent}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.webLogo}
              resizeMode="contain"
            />
            <Text style={[styles.webBrandTitle, { color: colors.bg }]}>{t('auth:register.joinSillage')}</Text>
            <Text style={[styles.webBrandSubtitle, { color: colors.bg }]}>
              {t('auth:register.tagline')}
            </Text>
            <Text style={[styles.webBrandDescription, { color: colors.bg, opacity: 0.9 }]}>
              {t('auth:register.description')}
            </Text>
          </View>
        </View>

        {/* COLUMNA DERECHA - FORMULARIO */}
        <ScrollView
          contentContainerStyle={styles.formSection}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={[styles.webFormTitle, { color: colors.text }]}>{t('auth:register.title')}</Text>
            <Text style={[styles.webFormSubtitle, { color: colors.secondary }]}>
              {t('auth:register.subtitle')}
            </Text>

            <View style={styles.webForm}>
              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.firstName')}</Text>
                  <TextInput
                    style={[
                      styles.webInput,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                      },
                    ]}
                    placeholder={t('auth:register.firstNamePlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={formData.first_name}
                    onChangeText={(value) => updateField('first_name', value)}
                    autoCapitalize="words"
                  />
                  {errors.first_name && (
                    <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.first_name}</Text>
                  )}
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.lastName')}</Text>
                  <TextInput
                    style={[
                      styles.webInput,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                      },
                    ]}
                    placeholder={t('auth:register.lastNamePlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={formData.last_name}
                    onChangeText={(value) => updateField('last_name', value)}
                    autoCapitalize="words"
                  />
                  {errors.last_name && (
                    <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.last_name}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.email')}</Text>
                <TextInput
                  style={[
                    styles.webInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                    },
                  ]}
                  placeholder={t('auth:register.emailPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.webInput,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                      },
                    ]}
                    placeholder={t('auth:register.passwordPlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
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
                {errors.password && (
                  <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.confirmPassword')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.webInput,
                      styles.passwordInput,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                      },
                    ]}
                    placeholder={t('auth:register.confirmPasswordPlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Checkbox de términos y condiciones */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={handleTermsChange}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, acceptedTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                    {acceptedTerms && (
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Text style={[styles.checkboxText, { color: colors.text }]}>
                    Acepto los{' '}
                  </Text>
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text style={[styles.termsLink, { color: colors.accent }]}>
                      términos y condiciones del servicio
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {errors.terms && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.terms}</Text>
              )}

              <TouchableOpacity
                style={[styles.webButton, { backgroundColor: colors.accent }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.bg }]}>
                    {t('auth:register.registerButton')}
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
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                  {t('auth:register.alreadyHaveAccount')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Términos y Condiciones */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTermsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Términos y Condiciones
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTermsModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <Text style={[styles.termsText, { color: colors.text }]}>
                  {TERMS_AND_CONDITIONS}
                </Text>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.bg }]}>
                    Aceptar y Continuar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButtonSecondary, { borderColor: colors.secondary }]}
                  onPress={() => setShowTermsModal(false)}
                >
                  <Text style={[styles.modalButtonSecondaryText, { color: colors.secondary }]}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('auth:register.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('auth:register.joinSillage')}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.firstName')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.accent,
                  },
                ]}
                placeholder={t('auth:register.firstNamePlaceholder')}
                placeholderTextColor={colors.secondary}
                value={formData.first_name}
                onChangeText={(value) => updateField('first_name', value)}
                autoCapitalize="words"
              />
              {errors.first_name && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.first_name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.lastName')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.accent,
                  },
                ]}
                placeholder={t('auth:register.lastNamePlaceholder')}
                placeholderTextColor={colors.secondary}
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                autoCapitalize="words"
              />
              {errors.last_name && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.last_name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.email')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.accent,
                  },
                ]}
                placeholder={t('auth:register.emailPlaceholder')}
                placeholderTextColor={colors.secondary}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                    },
                  ]}
                  placeholder={t('auth:register.passwordPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
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
              {errors.password && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth:register.confirmPassword')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                    },
                  ]}
                  placeholder={t('auth:register.confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Checkbox de términos y condiciones */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={handleTermsChange}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptedTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  {acceptedTerms && (
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text style={[styles.checkboxText, { color: colors.text }]}>
                  Acepto los{' '}
                </Text>
                <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                  <Text style={[styles.termsLink, { color: colors.accent }]}>
                    términos y condiciones del servicio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.terms && (
              <Text style={[styles.errorText, { color: '#EF4444', marginTop: 4 }]}>{errors.terms}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg }]}>
                  {t('auth:register.registerButton')}
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
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                {t('auth:register.alreadyHaveAccount')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Términos y Condiciones */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Términos y Condiciones
              </Text>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.termsText, { color: colors.text }]}>
                {TERMS_AND_CONDITIONS}
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.bg }]}>
                  Aceptar y Continuar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonSecondary, { borderColor: colors.secondary }]}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={[styles.modalButtonSecondaryText, { color: colors.secondary }]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  webLogo: {
    width: 160,
    height: 160,
    marginBottom: 30,
  },
  webBrandTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    flexWrap: 'nowrap',
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
    maxWidth: 500,
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
  inputRow: {
    flexDirection: 'row',
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
    paddingVertical: 20,
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
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
    flexWrap: 'nowrap',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
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
    marginVertical: 20,
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
  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
    maxHeight: 400,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  modalButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
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
});