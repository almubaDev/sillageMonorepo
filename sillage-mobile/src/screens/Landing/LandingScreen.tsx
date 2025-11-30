import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { LanguageSelector } from '../../components/LanguageSelector';

interface Props {
  navigation: any;
}

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const features = [
    {
      icon: 'bottle-tonic-plus',
      title: t('landing:features.discover.title'),
      description: t('landing:features.discover.description'),
    },
    {
      icon: 'palette-swatch',
      title: t('landing:features.accords.title'),
      description: t('landing:features.accords.description'),
    },
    {
      icon: 'heart-outline',
      title: t('landing:features.collection.title'),
      description: t('landing:features.collection.description'),
    },
    {
      icon: 'compass-outline',
      title: t('landing:features.recommend.title'),
      description: t('landing:features.recommend.description'),
    },
    {
      icon: 'chart-timeline-variant',
      title: t('landing:features.history.title'),
      description: t('landing:features.history.description'),
    },
    {
      icon: 'shopping-outline',
      title: t('landing:features.purchase.title'),
      description: t('landing:features.purchase.description'),
    },
  ];

  const handleGetStarted = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header con selector de idioma */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <LanguageSelector />
      </View>

      {/* Hero Section */}
      <LinearGradient
        colors={[colors.bg, colors.secondary + '40', colors.accent + '20']}
        style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}
      >
        <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {t('landing:hero.title')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.text }]}>
              {t('landing:hero.subtitle')}
            </Text>
            <Text style={[styles.heroDescription, { color: colors.secondary }]}>
              {t('landing:hero.description')}
            </Text>

            {/* CTA Buttons */}
            <View style={[styles.ctaContainer, isDesktop && styles.ctaContainerDesktop]}>
              <TouchableOpacity
                style={[styles.ctaButton, styles.ctaPrimary, { backgroundColor: colors.accent }]}
                onPress={handleGetStarted}
              >
                <MaterialCommunityIcons name="rocket-launch" size={24} color={colors.bg} />
                <Text style={[styles.ctaButtonText, { color: colors.bg }]}>
                  {t('landing:cta.getStarted')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  styles.ctaSecondary,
                  { borderColor: colors.accent, backgroundColor: 'transparent' },
                ]}
                onPress={handleLogin}
              >
                <MaterialCommunityIcons name="login" size={24} color={colors.accent} />
                <Text style={[styles.ctaButtonText, { color: colors.accent }]}>
                  {t('landing:cta.login')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Image */}
          {isDesktop && (
            <View style={styles.heroImageContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={[styles.featuresSection, isDesktop && styles.featuresSectionDesktop]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('landing:features.title')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
          {t('landing:features.subtitle')}
        </Text>

        <View
          style={[
            styles.featuresGrid,
            isDesktop && styles.featuresGridDesktop,
            isTablet && styles.featuresGridTablet,
          ]}
        >
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { backgroundColor: colors.bg, borderColor: colors.accent + '30' },
                isDesktop && styles.featureCardDesktop,
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name={feature.icon as any} size={32} color={colors.accent} />
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.secondary }]}>
                {feature.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={[styles.statsSection, isDesktop && styles.statsSectionDesktop]}>
        <LinearGradient
          colors={[colors.accent + '20', colors.accent + '10']}
          style={styles.statsGradient}
        >
          <View style={[styles.statsContainer, isDesktop && styles.statsContainerDesktop]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="bottle-tonic" size={40} color={colors.accent} />
              <Text style={[styles.statNumber, { color: colors.text }]}>10,000+</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('landing:stats.perfumes')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={40} color={colors.accent} />
              <Text style={[styles.statNumber, { color: colors.text }]}>5,000+</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('landing:stats.users')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={40} color={colors.accent} />
              <Text style={[styles.statNumber, { color: colors.text }]}>4.8/5</Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('landing:stats.rating')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Final CTA Section */}
      <View style={[styles.finalCtaSection, isDesktop && styles.finalCtaSectionDesktop]}>
        <LinearGradient
          colors={[colors.accent + '30', colors.accent + '10']}
          style={styles.finalCtaGradient}
        >
          <MaterialCommunityIcons name="sparkles" size={48} color={colors.accent} />
          <Text style={[styles.finalCtaTitle, { color: colors.text }]}>
            {t('landing:finalCta.title')}
          </Text>
          <Text style={[styles.finalCtaSubtitle, { color: colors.secondary }]}>
            {t('landing:finalCta.subtitle')}
          </Text>
          <TouchableOpacity
            style={[styles.finalCtaButton, { backgroundColor: colors.accent }]}
            onPress={handleGetStarted}
          >
            <Text style={[styles.finalCtaButtonText, { color: colors.bg }]}>
              {t('landing:cta.getStarted')}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color={colors.bg} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.accent + '30' }]}>
        <Text style={[styles.footerText, { color: colors.secondary }]}>
          {t('landing:footer.copyright')}
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.accent }]}>
              {t('landing:footer.privacy')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerSeparator, { color: colors.secondary }]}>•</Text>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: colors.accent }]}>
              {t('landing:footer.terms')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerDesktop: {
    paddingHorizontal: 80,
    paddingTop: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 40,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  heroSectionDesktop: {
    paddingHorizontal: 80,
    paddingVertical: 100,
  },
  heroContent: {
    width: '100%',
    alignItems: 'center',
  },
  heroContentDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
  },
  heroText: {
    alignItems: 'center',
    maxWidth: 600,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 50,
  },
  heroSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroImageContainer: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },

  // CTA Buttons
  ctaContainer: {
    width: '100%',
    gap: 16,
    marginTop: 16,
  },
  ctaContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 500,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaPrimary: {
    flex: 1,
  },
  ctaSecondary: {
    flex: 1,
    borderWidth: 2,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: 'center',
  },
  featuresSectionDesktop: {
    paddingHorizontal: 80,
    paddingVertical: 100,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 600,
  },
  featuresGrid: {
    width: '100%',
    gap: 20,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 1400,
    justifyContent: 'center',
  },
  featuresGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureCardDesktop: {
    width: '30%',
    minWidth: 300,
  },
  featureIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  statsSectionDesktop: {
    paddingHorizontal: 80,
    paddingVertical: 60,
  },
  statsGradient: {
    borderRadius: 20,
    padding: 40,
  },
  statsContainer: {
    gap: 40,
  },
  statsContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: 1400,
    marginHorizontal: 'auto',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 16,
  },

  // Final CTA Section
  finalCtaSection: {
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  finalCtaSectionDesktop: {
    paddingHorizontal: 80,
    paddingVertical: 100,
  },
  finalCtaGradient: {
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  finalCtaSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 600,
  },
  finalCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finalCtaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerSeparator: {
    fontSize: 14,
  },
});
