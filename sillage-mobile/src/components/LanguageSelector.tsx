import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { changeLanguage } from '../i18n';

interface LanguageSelectorProps {
  position?: 'top-right' | 'top-left';
}

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ position = 'top-right' }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const isWeb = Platform.OS === 'web';

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setModalVisible(false);
    setDropdownVisible(false);
  };

  const positionStyle = position === 'top-right'
    ? styles.topRight
    : styles.topLeft;

  const handlePress = () => {
    if (isWeb) {
      setDropdownVisible(!dropdownVisible);
    } else {
      setModalVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, positionStyle, { backgroundColor: colors.bg }]}
        onPress={handlePress}
      >
        <Text style={styles.flag}>{currentLanguage.flag}</Text>
        <MaterialCommunityIcons name="chevron-down" size={16} color={colors.text} />
      </TouchableOpacity>

      {/* Dropdown para Web - aparece debajo del botón */}
      {isWeb && dropdownVisible && (
        <>
          <TouchableOpacity
            style={styles.webOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          />
          <View
            style={[
              styles.webDropdown,
              position === 'top-right' ? styles.dropdownRight : styles.dropdownLeft,
              { backgroundColor: colors.bg },
            ]}
          >
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>
              {t('common:selectLanguage')}
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
                    { color: colors.text },
                    i18n.language === language.code && { fontWeight: 'bold' },
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
        </>
      )}

      {/* Modal para Mobile - aparece centrado */}
      {!isWeb && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('common:selectLanguage')}
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
                      { color: colors.text },
                      i18n.language === language.code && { fontWeight: 'bold' },
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
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...(Platform.OS === 'web' ? { position: 'fixed' } : { position: 'absolute' }),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  topRight: {
    top: Platform.OS === 'web' ? 20 : 50,
    right: 20,
  },
  topLeft: {
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  // Overlay transparente para web
  webOverlay: {
    ...(Platform.OS === 'web' ? { position: 'fixed' } : { position: 'absolute' }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  // Dropdown para web
  webDropdown: {
    ...(Platform.OS === 'web' ? { position: 'fixed' } : { position: 'absolute' }),
    top: Platform.OS === 'web' ? 65 : 95, // Debajo del botón
    width: 240,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  dropdownRight: {
    right: 20,
  },
  dropdownLeft: {
    left: 20,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  // Modal para mobile
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 280,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageFlag: {
    fontSize: 22,
    marginRight: 10,
  },
  languageName: {
    fontSize: 15,
    flex: 1,
  },
});
