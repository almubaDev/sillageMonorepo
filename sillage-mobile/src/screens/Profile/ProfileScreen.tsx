import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, useWindowDimensions, Modal, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import { changeLanguage } from '../../i18n';
import { authService } from '../../services/authService';
import { couponService } from '../../services/couponService';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors, cyclePalette } = useTheme();
  const { user, logout, refreshUser } = useAuthContext();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  // Estados para eliminar cuenta
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Refrescar datos del usuario cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  const handleLogout = async () => {
    await logout();
  };

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setLanguageModalVisible(false);
  };

  const handleChangePassword = async () => {
    // console.log('🔒 Iniciando cambio de contraseña...');
    // console.log('Contraseña actual:', currentPassword ? '✓' : '✗');
    // console.log('Nueva contraseña:', newPassword ? '✓' : '✗');
    // console.log('Confirmar contraseña:', confirmPassword ? '✓' : '✗');

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      // console.log('❌ Validación fallida: campos vacíos');
      Alert.alert(
        t('profile:password.error'),
        t('profile:password.allFieldsRequired')
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      // console.log('❌ Validación fallida: contraseñas no coinciden');
      Alert.alert(
        t('profile:password.error'),
        t('profile:password.passwordsDoNotMatch')
      );
      return;
    }

    if (newPassword.length < 8) {
      // console.log('❌ Validación fallida: menos de 8 caracteres');
      Alert.alert(
        t('profile:password.error'),
        t('profile:password.minLength')
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      // console.log('❌ Validación fallida: sin mayúscula');
      Alert.alert(
        t('profile:password.error'),
        t('profile:password.requireUppercase')
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      // console.log('❌ Validación fallida: sin número');
      Alert.alert(
        t('profile:password.error'),
        t('profile:password.requireNumber')
      );
      return;
    }

    // console.log('✅ Todas las validaciones pasaron');

    try {
      setIsChangingPassword(true);
      // console.log('📡 Llamando al servicio de cambio de contraseña...');

      await authService.changePassword(currentPassword, newPassword);

      // console.log('✅ Contraseña cambiada exitosamente');

      // Cerrar modal primero
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Mostrar alert después
      setTimeout(() => {
        Alert.alert(
          t('profile:password.success'),
          t('profile:password.passwordChanged')
        );
      }, 100);
    } catch (error: any) {
      console.error('❌ Error cambiando contraseña:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);

      const errorMessage = error.response?.data?.detail || error.message || t('profile:password.changeFailed');

      Alert.alert(
        t('profile:password.error'),
        errorMessage
      );
    } finally {
      setIsChangingPassword(false);
      // console.log('🔒 Proceso finalizado');
    }
  };

  const handleRedeemCoupon = async () => {
    // console.log('🎫 Iniciando canje de cupón...');
    // console.log('Código:', couponCode ? '✓' : '✗');

    // Limpiar mensaje anterior
    setCouponMessage(null);

    // Validación
    if (!couponCode || couponCode.trim().length === 0) {
      // console.log('❌ Validación fallida: código vacío');
      setCouponMessage({
        type: 'error',
        title: t('profile:password.error'),
        message: t('profile:coupon.emptyCode')
      });
      return;
    }

    try {
      setIsRedeemingCoupon(true);
      // console.log('📡 Llamando al servicio de canje de cupón...');

      const result = await couponService.redeemCoupon(couponCode);

      // console.log('✅ Cupón canjeado exitosamente:', result);

      // Refrescar datos del usuario para actualizar consultas_restantes
      await refreshUser();

      // Mostrar mensaje de éxito
      setCouponMessage({
        type: 'success',
        title: t('profile:coupon.successTitle'),
        message: t('profile:coupon.successMessage', { added: result.consultations_added, total: result.new_total })
      });

      // Limpiar código
      setCouponCode('');
    } catch (error: any) {
      console.error('❌ Error canjeando cupón:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);

      const errorDetail = error.response?.data?.detail || error.message || t('profile:deleteAccount.failed');

      // Mensajes personalizados según el error
      let title = t('profile:password.error');
      let message = errorDetail;

      if (errorDetail.includes('ya fue utilizado') || errorDetail.includes('Ya has utilizado') || errorDetail.includes('already')) {
        title = t('profile:coupon.alreadyUsedTitle');
        message = t('profile:coupon.alreadyUsedMessage');
      } else if (errorDetail.includes('ha expirado') || errorDetail.includes('expired')) {
        title = t('profile:coupon.expiredTitle');
        message = t('profile:coupon.expiredMessage');
      } else if (errorDetail.includes('no encontrado') || errorDetail.includes('not found')) {
        title = t('profile:coupon.notFoundTitle');
        message = t('profile:coupon.notFoundMessage');
      }

      // Mostrar mensaje de error en la interfaz
      setCouponMessage({
        type: 'error',
        title: title,
        message: message
      });
    } finally {
      setIsRedeemingCoupon(false);
      // console.log('🎫 Proceso finalizado');
    }
  };

  const handleDeleteAccount = () => {
    // console.log('🗑️🗑️🗑️ ===== BOTÓN ELIMINAR PRESIONADO ===== 🗑️🗑️🗑️');
    // console.log('Email ingresado:', deleteEmail);
    // console.log('Email del usuario:', user?.email);
    // console.log('Contraseña ingresada:', deletePassword ? '✓ (tiene valor)' : '✗ (vacía)');
    // console.log('Estado actual isDeletingAccount:', isDeletingAccount);
    // console.log('Estado actual showDeleteConfirmation:', showDeleteConfirmation);

    // Limpiar error anterior
    setDeleteAccountError('');

    // Validaciones
    if (!deleteEmail || !deletePassword) {
      // console.log('❌ Validación fallida: campos vacíos');
      setDeleteAccountError(t('profile:deleteAccount.emptyFields'));
      return;
    }

    if (deleteEmail !== user?.email) {
      // console.log('❌ Validación fallida: email no coincide');
      setDeleteAccountError(t('profile:deleteAccount.emailMismatch', { email: user?.email }));
      return;
    }

    // console.log('✅✅✅ Validaciones pasadas, mostrando confirmación');
    // Mostrar confirmación
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      // console.log('📡 Llamando al servicio de eliminación...');
      // console.log('Contraseña a enviar:', deletePassword ? '***' : 'vacía');

      await authService.deleteAccount(deletePassword);

      // console.log('✅ Cuenta eliminada exitosamente');

      // Cerrar modales
      setDeleteAccountModalVisible(false);
      setShowDeleteConfirmation(false);

      // Cerrar sesión automáticamente
      await logout();
    } catch (error: any) {
      console.error('❌ Error eliminando cuenta:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      console.error('Response:', error.response?.data);

      const errorMessage = error.response?.data?.detail || error.message || t('profile:deleteAccount.failed');

      setDeleteAccountError(errorMessage);
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeletingAccount(false);
    }
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

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={cyclePalette}
        >
          <MaterialCommunityIcons name="palette" size={22} color={colors.bg} />
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('profile:actions.changeTheme')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <MaterialCommunityIcons name="translate" size={22} color={colors.bg} />
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('profile:actions.changeLanguage')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => setPasswordModalVisible(true)}
        >
          <MaterialCommunityIcons name="lock-reset" size={22} color={colors.bg} />
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('profile:actions.changePassword')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#8B5CF6' }]}
          onPress={() => setCouponModalVisible(true)}
        >
          <MaterialCommunityIcons name="ticket-percent" size={22} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: '#FFFFFF', fontFamily: 'Lato-Bold' }]}>
            {t('profile:coupon.title')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.secondary }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color={colors.secondary} />
          <Text style={[styles.buttonText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
            {t('profile:actions.logout')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: '#EF4444' }]}
          onPress={() => setDeleteAccountModalVisible(true)}
        >
          <MaterialCommunityIcons name="delete-forever" size={22} color="#EF4444" />
          <Text style={[styles.buttonText, { color: '#EF4444', fontFamily: 'Lato-Bold' }]}>
            {t('profile:deleteAccount.button')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de selección de idioma */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
              {t('profile:language.title')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              {t('profile:language.current')}: {currentLanguage.name}
            </Text>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  i18n.language === language.code && {
                    backgroundColor: colors.accent + '20',
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    { color: colors.text, fontFamily: 'Lato-Regular' },
                    i18n.language === language.code && { fontFamily: 'Lato-Bold' },
                  ]}
                >
                  {language.name}
                </Text>
                {i18n.language === language.code && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.accent}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPasswordModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              style={[styles.modalContent, { backgroundColor: colors.bg }]}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
                {t('profile:password.title')}
              </Text>

              {/* Contraseña actual */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:password.currentPassword')}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInputField,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                        fontFamily: 'Lato-Regular',
                      },
                    ]}
                    placeholder={t('profile:password.enterCurrent')}
                    placeholderTextColor={colors.secondary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nueva contraseña */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:password.newPassword')}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInputField,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                        fontFamily: 'Lato-Regular',
                      },
                    ]}
                    placeholder={t('profile:password.enterNew')}
                    placeholderTextColor={colors.secondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:password.confirmPassword')}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInputField,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                        fontFamily: 'Lato-Regular',
                      },
                    ]}
                    placeholder={t('profile:password.enterConfirm')}
                    placeholderTextColor={colors.secondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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
              </View>

              {/* Requisitos de contraseña */}
              <View style={[styles.passwordRequirements, { backgroundColor: colors.accent + '10' }]}>
                <Text style={[styles.requirementsTitle, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                  {t('profile:password.requirements')}
                </Text>
                <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  • {t('profile:password.req8Chars')}
                </Text>
                <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  • {t('profile:password.reqUppercase')}
                </Text>
                <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  • {t('profile:password.reqNumber')}
                </Text>
              </View>

              {/* Botones */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.secondary }]}
                  onPress={() => {
                    setPasswordModalVisible(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={isChangingPassword}
                >
                  <Text style={[styles.modalButtonText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
                    {t('profile:password.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: colors.accent }]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  <Text style={[styles.modalButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
                    {isChangingPassword ? t('profile:password.changing') : t('profile:password.change')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de canje de cupón */}
      <Modal
        visible={couponModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCouponModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="ticket-percent" size={48} color="#8B5CF6" />
              </View>

              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
                {t('profile:coupon.title')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.secondary, fontFamily: 'Lato-Regular', marginBottom: 20 }]}>
                {t('profile:coupon.subtitle')}
              </Text>

              {/* Mensaje de resultado */}
              {couponMessage && (
                <View style={[
                  styles.messageBox,
                  {
                    backgroundColor: couponMessage.type === 'success' ? '#10B98120' : '#EF444420',
                    borderLeftColor: couponMessage.type === 'success' ? '#10B981' : '#EF4444',
                    marginBottom: 20,
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={couponMessage.type === 'success' ? 'check-circle' : 'alert-circle'}
                    size={24}
                    color={couponMessage.type === 'success' ? '#10B981' : '#EF4444'}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.messageTitle, {
                      color: couponMessage.type === 'success' ? '#10B981' : '#EF4444',
                      fontFamily: 'Lato-Bold'
                    }]}>
                      {couponMessage.title}
                    </Text>
                    <Text style={[styles.messageText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                      {couponMessage.message}
                    </Text>
                  </View>
                </View>
              )}

              {/* Input de código */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:coupon.codeLabel')}
                </Text>
                <TextInput
                  style={[styles.couponInput, {
                    color: colors.text,
                    fontFamily: 'Courier',
                    borderColor: colors.secondary + '40',
                    backgroundColor: colors.accent + '05'
                  }]}
                  placeholder="Ej: ABC123XYZ456"
                  placeholderTextColor={colors.secondary}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={50}
                />
              </View>

              {/* Botones */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.secondary }]}
                  onPress={() => {
                    setCouponModalVisible(false);
                    setCouponCode('');
                    setCouponMessage(null);
                  }}
                  disabled={isRedeemingCoupon}
                >
                  <Text style={[styles.modalButtonText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
                    {t('profile:coupon.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: '#8B5CF6' }]}
                  onPress={handleRedeemCoupon}
                  disabled={isRedeemingCoupon}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: 'Lato-Bold' }]}>
                    {isRedeemingCoupon ? t('profile:coupon.redeeming') : t('profile:coupon.redeem')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de eliminar cuenta */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeleteAccountModalVisible(false)}
        >
          <Pressable onPress={() => {}}>

            <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
              </View>

              <Text style={[styles.modalTitle, { color: '#EF4444', fontFamily: 'AlanSans-Bold' }]}>
                {t('profile:deleteAccount.title')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.secondary, fontFamily: 'Lato-Regular', marginBottom: 20 }]}>
                {t('profile:deleteAccount.warning')}
              </Text>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:deleteAccount.confirmEmail')}
                </Text>
                <TextInput
                  style={[
                    styles.passwordInputField,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.accent,
                      fontFamily: 'Lato-Regular',
                    },
                  ]}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.secondary}
                  value={deleteEmail}
                  onChangeText={setDeleteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Contraseña */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('profile:deleteAccount.confirmPassword')}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInputField,
                      {
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.accent,
                        fontFamily: 'Lato-Regular',
                      },
                    ]}
                    placeholder={t('profile:deleteAccount.passwordPlaceholder')}
                    placeholderTextColor={colors.secondary}
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    secureTextEntry={!showDeletePassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowDeletePassword(!showDeletePassword)}
                  >
                    <MaterialCommunityIcons
                      name={showDeletePassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mensaje de error */}
              {deleteAccountError && (
                <View style={[
                  styles.messageBox,
                  {
                    backgroundColor: '#EF444420',
                    borderLeftColor: '#EF4444',
                    marginBottom: 20,
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={24}
                    color="#EF4444"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.messageText, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>
                      {deleteAccountError}
                    </Text>
                  </View>
                </View>
              )}

              {/* Modal de confirmación final */}
              {showDeleteConfirmation && (
                <View style={[styles.messageBox, {
                  backgroundColor: '#FEF2F2',
                  borderLeftColor: '#EF4444',
                  marginBottom: 20,
                }]}>
                  <MaterialCommunityIcons name="alert" size={24} color="#EF4444" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.messageTitle, { color: '#EF4444', fontFamily: 'Lato-Bold' }]}>
                      {t('profile:deleteAccount.finalConfirmTitle')}
                    </Text>
                    <Text style={[styles.messageText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                      {t('profile:deleteAccount.finalConfirmMessage')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Botones */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.secondary }]}
                  onPress={() => {
                    setDeleteAccountModalVisible(false);
                    setDeleteEmail('');
                    setDeletePassword('');
                    setDeleteAccountError('');
                    setShowDeleteConfirmation(false);
                  }}
                  disabled={isDeletingAccount}
                >
                  <Text style={[styles.modalButtonText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
                    {t('profile:deleteAccount.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    if (showDeleteConfirmation) {
                      confirmDeleteAccount();
                    } else {
                      handleDeleteAccount();
                    }
                  }}
                  disabled={isDeletingAccount}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontFamily: 'Lato-Bold' }]}>
                    {isDeletingAccount ? t('profile:deleteAccount.deleting') : showDeleteConfirmation ? t('profile:deleteAccount.confirmButton') : t('profile:deleteAccount.deleteButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  // Modal de idioma
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    flex: 1,
  },
  // Modal de contraseña
  modalScrollContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInputField: {
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  couponInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
  messageBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  messageTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  passwordRequirements: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalButtonConfirm: {},
  modalButtonText: {
    fontSize: 15,
    textAlign: 'center',
  },
});