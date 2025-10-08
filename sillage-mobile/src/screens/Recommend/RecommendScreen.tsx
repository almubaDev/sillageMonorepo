import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { LocationMap } from '../../components/LocationMap';
import type { Palette } from '../../theme/colors';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type Option = {
  value: string;
  label: string;
};

const applyOpacity = (hex: string, opacity: number) => {
  const normalized = Math.max(0, Math.min(1, opacity));
  if (!hex.startsWith('#')) {
    return hex;
  }

  const raw = hex.replace('#', '');
  if (raw.length !== 6 && raw.length !== 8) {
    return hex;
  }

  const alpha = Math.round(normalized * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${raw.slice(0, 6)}${alpha}`;
};

const STEP_LABELS = ['Ubicación', 'Contexto', 'Finaliza'];

const OptionPill: React.FC<{
  option: Option;
  selected: boolean;
  onPress: (value: string) => void;
  accent: string;
  textColor: string;
}> = ({ option, selected, onPress, accent, textColor }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(option.value)}
      style={[
        styles.optionPill,
        {
          backgroundColor: applyOpacity(textColor, 0.06),
          borderColor: applyOpacity(textColor, 0.15),
        },
        selected && { backgroundColor: accent, borderColor: accent },
      ]}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.optionPillText,
          { color: selected ? '#0B0B0B' : textColor, fontFamily: selected ? 'Lato-Bold' : 'Lato-Regular' },
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
};

const StepCard: React.FC<{
  index: number;
  title: string;
  icon: string;
  colors: Palette;
  children: React.ReactNode;
}> = ({ index, title, icon, colors, children }) => {
  return (
    <View
      style={[
        styles.stepCard,
        {
          backgroundColor: applyOpacity(colors.text, 0.035),
          borderColor: applyOpacity(colors.accent, 0.35),
          shadowColor: applyOpacity(colors.text, 0.22),
        },
      ]}
    >
      <View style={styles.stepCardHeader}>
        <View
          style={[styles.stepBadge, { backgroundColor: applyOpacity(colors.accent, 0.18), borderColor: colors.accent }]}
        >
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.accent} />
          <Text style={[styles.stepBadgeText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>Paso {index}</Text>
        </View>
        <Text style={[styles.stepTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

const ScrollHint: React.FC<{ colors: Palette }> = ({ colors }) => {
  const translateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [translateAnim]);

  const translateY = translateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.scrollHint,
        {
          backgroundColor: applyOpacity(colors.bg, 0.92),
          borderColor: applyOpacity(colors.accent, 0.4),
          transform: [{ translateY }],
        },
      ]}
    >
      <MaterialCommunityIcons name="gesture-swipe-vertical" size={20} color={colors.accent} />
      <Text style={[styles.scrollHintText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Desliza para ver más</Text>
    </Animated.View>
  );
};

export const RecommendScreen = () => {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;

  const [addressQuery, setAddressQuery] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [searchedAddress, setSearchedAddress] = useState<string>('Ciudad de México, MX');
  const [coordinate, setCoordinate] = useState<Coordinate>({ latitude: 19.432608, longitude: -99.133209 });

  const [selectedMoment, setSelectedMoment] = useState('noche');
  const [selectedVibe, setSelectedVibe] = useState('elegante');
  const [selectedDressCode, setSelectedDressCode] = useState('formal');

  const [contentScrollable, setContentScrollable] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const momentOptions = useMemo<Option[]>(
    () => [
      { value: 'manana', label: 'Mañana' },
      { value: 'tarde', label: 'Tarde' },
      { value: 'noche', label: 'Noche' },
    ],
    []
  );

  const vibeOptions = useMemo<Option[]>(
    () => [
      { value: 'elegante', label: 'Elegante' },
      { value: 'relajado', label: 'Relajado' },
      { value: 'atrevido', label: 'Atrevido' },
    ],
    []
  );

  const dressCodeOptions = useMemo<Option[]>(
    () => [
      { value: 'casual', label: 'Casual' },
      { value: 'formal', label: 'Formal' },
      { value: 'festivo', label: 'Festivo' },
    ],
    []
  );

  const handleSearchAddress = useCallback(async () => {
    if (!addressQuery.trim()) {
      setAddressError('Ingresa una dirección para buscar.');
      return;
    }

    try {
      setAddressError(null);
      setSearchingAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(addressQuery)}`
      );
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);

        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setCoordinate({ latitude: lat, longitude: lon });
          setSearchedAddress(firstResult.display_name || addressQuery);
          setAddressError(null);
        } else {
          setAddressError('No se pudo interpretar la ubicación recibida.');
        }
      } else {
        setAddressError('No encontramos esa dirección. Intenta ser más específico.');
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
      setAddressError('No pudimos buscar la dirección. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setSearchingAddress(false);
    }
  }, [addressQuery]);

  const handleGenerate = useCallback(() => {
    Alert.alert(
      'Recomendador',
      'Estamos finalizando la conexión con el motor de IA. Muy pronto podrás generar recomendaciones desde aquí.'
    );
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasScrolled && event.nativeEvent.contentOffset.y > 32) {
        setHasScrolled(true);
      }
    },
    [hasScrolled]
  );

  const handleContentSizeChange = useCallback(
    (_: number, contentHeight: number) => {
      const shouldScroll = contentHeight > height * 0.98;
      setContentScrollable(shouldScroll);
    },
    [height]
  );

  const mapHeight = Platform.OS === 'web' ? (isLargeScreen ? 420 : 360) : isLargeScreen ? 360 : 280;
  const showScrollHint = contentScrollable && !hasScrolled;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { minHeight: height + 40 }]}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={styles.header}>
          <View style={[styles.heroBadge, { backgroundColor: applyOpacity(colors.accent, 0.16) }]}> 
            <MaterialCommunityIcons name="auto-fix" size={18} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>Asistente inteligente</Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>Planifica tu próxima esencia</Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Comparte el contexto de tu evento, confirma la ubicación en el mapa y deja que nuestro motor te sugiera el perfume perfecto.</Text>
        </View>

        <View
          style={[styles.stepIndicator, { borderColor: applyOpacity(colors.accent, 0.28), backgroundColor: applyOpacity(colors.text, 0.03) }]}
        >
          {STEP_LABELS.map((label, index) => (
            <React.Fragment key={label}>
              <View style={styles.stepIndicatorItem}>
                <View
                  style={[
                    styles.stepNumber,
                    {
                      backgroundColor: index === 0 ? colors.accent : applyOpacity(colors.accent, 0.2),
                      borderColor: applyOpacity(colors.accent, 0.45),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      {
                        color: index === 0 ? colors.bg : colors.accent,
                        fontFamily: 'Lato-Bold',
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepIndicatorLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>{label}</Text>
              </View>
              {index < STEP_LABELS.length - 1 && (
                <View style={[styles.stepSeparator, { backgroundColor: applyOpacity(colors.secondary, 0.35) }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <StepCard index={1} title="Confirma la ubicación" icon="map-marker" colors={colors}>
          <Text style={[styles.paragraph, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            Escríbenos la dirección y validaremos la posición en el mapa. En móviles obtendrás una vista previa y podrás abrirla en pantalla completa; en web, el mapa es interactivo.
          </Text>

          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-search-outline" size={20} color={colors.secondary} />
            <TextInput
              value={addressQuery}
              onChangeText={setAddressQuery}
              placeholder="Ej. Paseo de la Reforma 250, CDMX"
              placeholderTextColor={applyOpacity(colors.secondary, 0.7)}
              style={[
                styles.addressInput,
                {
                  backgroundColor: applyOpacity(colors.text, 0.04),
                  borderColor: applyOpacity(colors.accent, 0.35),
                  color: colors.text,
                  fontFamily: 'Lato-Regular',
                },
              ]}
              returnKeyType="search"
              onSubmitEditing={handleSearchAddress}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.accent }]}
            onPress={handleSearchAddress}
            activeOpacity={0.88}
            disabled={searchingAddress}
          >
            {searchingAddress ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="magnify" size={18} color={colors.bg} />
                <Text style={[styles.searchButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>Buscar en el mapa</Text>
              </>
            )}
          </TouchableOpacity>

          {addressError ? (
            <Text style={[styles.errorText, { color: colors.accent, fontFamily: 'Lato-Regular' }]}>{addressError}</Text>
          ) : (
            <Text style={[styles.helperText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Última dirección seleccionada: {searchedAddress}</Text>
          )}

          <View
            style={[
              styles.mapContainer,
              {
                height: mapHeight,
                backgroundColor: applyOpacity(colors.text, 0.02),
                borderColor: applyOpacity(colors.accent, 0.25),
              },
            ]}
          >
            <LocationMap latitude={coordinate.latitude} longitude={coordinate.longitude} zoom={14} />
          </View>
        </StepCard>

        <StepCard index={2} title="Contexto del encuentro" icon="account-group" colors={colors}>
          <Text style={[styles.paragraph, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            Estos detalles ayudan al recomendador a interpretar el ambiente y ajustar la intensidad aromática.
          </Text>

          <View style={styles.optionGroup}>
            <Text style={[styles.optionLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Momento del día</Text>
            <View style={styles.optionRow}>
              {momentOptions.map(option => (
                <OptionPill
                  key={option.value}
                  option={option}
                  selected={option.value === selectedMoment}
                  onPress={setSelectedMoment}
                  accent={colors.accent}
                  textColor={colors.text}
                />
              ))}
            </View>
          </View>

          <View style={styles.optionGroup}>
            <Text style={[styles.optionLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Vibra deseada</Text>
            <View style={styles.optionRow}>
              {vibeOptions.map(option => (
                <OptionPill
                  key={option.value}
                  option={option}
                  selected={option.value === selectedVibe}
                  onPress={setSelectedVibe}
                  accent={colors.accent}
                  textColor={colors.text}
                />
              ))}
            </View>
          </View>

          <View style={styles.optionGroup}>
            <Text style={[styles.optionLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>Código de vestimenta</Text>
            <View style={styles.optionRow}>
              {dressCodeOptions.map(option => (
                <OptionPill
                  key={option.value}
                  option={option}
                  selected={option.value === selectedDressCode}
                  onPress={setSelectedDressCode}
                  accent={colors.accent}
                  textColor={colors.text}
                />
              ))}
            </View>
          </View>
        </StepCard>

        <StepCard index={3} title="Listo para recomendar" icon="star-circle" colors={colors}>
          <Text style={[styles.paragraph, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            Usa el botón inferior para enviar estos datos y recibir sugerencias personalizadas. Te mostraremos el perfume principal y alternativas compatibles con la ocasión.
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: applyOpacity(colors.accent, 0.1), borderColor: applyOpacity(colors.accent, 0.45) }]}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.accent} />
              <Text style={[styles.summaryText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>{searchedAddress}</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={colors.accent} />
              <Text style={[styles.summaryText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                Momento: {momentOptions.find(option => option.value === selectedMoment)?.label} · Vibra: {vibeOptions.find(option => option.value === selectedVibe)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="tie" size={20} color={colors.accent} />
              <Text style={[styles.summaryText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                Vestimenta: {dressCodeOptions.find(option => option.value === selectedDressCode)?.label}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleGenerate}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="play-circle" size={22} color={colors.bg} />
            <Text style={[styles.primaryButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>Generar recomendación</Text>
          </TouchableOpacity>
        </StepCard>
      </ScrollView>

      {showScrollHint && (
        <View style={styles.scrollHintWrapper} pointerEvents="box-none">
          <ScrollHint colors={colors} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 32,
    gap: 28,
  },
  header: {
    gap: 12,
    alignItems: 'flex-start',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 15,
  },
  stepIndicatorLabel: {
    fontSize: 13,
  },
  stepSeparator: {
    width: 18,
    height: 1.5,
  },
  stepCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  stepCardHeader: {
    gap: 10,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontSize: 12,
  },
  stepTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  searchButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchButtonText: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
  },
  mapContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    fontSize: 13,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionPillText: {
    fontSize: 13,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 15,
  },
  scrollHintWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollHint: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  scrollHintText: {
    fontSize: 12,
  },
});
