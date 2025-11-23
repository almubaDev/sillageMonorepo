import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { reportMapsUsage } from '../../../services/api';

declare global {
  interface Window {
    google: any;
  }
}

interface Step8LocationProps {
  value: {
    latitud: number | null;
    longitud: number | null;
    nombre: string;
    direccion: string;
  };
  onChange: (location: {
    latitud: number;
    longitud: number;
    nombre: string;
    direccion: string;
  }) => void;
}

export const Step8Location: React.FC<Step8LocationProps> = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [adjustmentUsed, setAdjustmentUsed] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const defaultLocation = {
    lat: value.latitud || -33.4489,
    lng: value.longitud || -70.6693,
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!window.google) {
        const script = document.createElement('script');
        const mapLanguage = i18n.language === 'en' ? 'en' : 'es';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=${mapLanguage}`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    }
  }, []);

  const initMap = () => {
    if (!window.google) return;

    const mapElement = document.getElementById('google-map');
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: defaultLocation,
      zoom: 13,
    });

    const marker = new window.google.maps.Marker({
      map: map,
      position: defaultLocation,
      draggable: true,
      visible: value.latitud !== null && value.longitud !== null,
    });

    const geocoder = new window.google.maps.Geocoder();

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        updateLocation(pos.lat(), pos.lng(), geocoder);
      }
    });

    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      marker.setVisible(true);
      map.panTo({ lat, lng });
      updateLocation(lat, lng, geocoder);
    });

    mapRef.current = map;
    markerRef.current = marker;
    geocoderRef.current = geocoder;
    setMapLoaded(true);

    if (value.latitud && value.longitud) {
      const pos = { lat: value.latitud, lng: value.longitud };
      map.setCenter(pos);
      marker.setPosition(pos);
      marker.setVisible(true);
    }
  };

  // Deshabilitar drag cuando se usa el ajuste
  useEffect(() => {
    if (markerRef.current) {
      const shouldBeDraggable = !(hasSearched && adjustmentUsed);
      markerRef.current.setDraggable(shouldBeDraggable);
    }
  }, [hasSearched, adjustmentUsed]);

  const updateLocation = async (lat: number, lng: number, geocoder: any, isFromSearch: boolean = false) => {
    // Si ya se usó el ajuste después de una búsqueda, no permitir más cambios
    if (!isFromSearch && hasSearched && adjustmentUsed) {
      Alert.alert(
        t('recommend:step8.adjustmentUsed'),
        t('recommend:step8.tryAgain')
      );
      return;
    }

    try {
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        // Si ya se había buscado y no es una búsqueda nueva, marcar el ajuste como usado
        // El ajuste es gratis (no se reporta al backend)
        if (!isFromSearch && hasSearched) {
          setAdjustmentUsed(true);
        } else if (!isFromSearch) {
          // Solo reportar si NO es un ajuste (es un click inicial sin búsqueda previa)
          reportMapsUsage('reverse_geocode');
        }

        if (status === 'OK' && results[0]) {
          onChange({
            latitud: lat,
            longitud: lng,
            nombre: results[0].address_components?.[0]?.long_name || t('recommend:step8.selectLocation'),
            direccion: results[0].formatted_address,
          });
        } else {
          onChange({
            latitud: lat,
            longitud: lng,
            nombre: t('recommend:step8.selectLocation'),
            direccion: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }
      });
    } catch (error) {
      console.error('Error en geocodificación:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(t('recommend:step8.errors.searchFailed'), t('recommend:step8.searchPlaceholder'));
      return;
    }

    if (!geocoderRef.current || !mapRef.current || !markerRef.current) {
      Alert.alert(t('recommend:step8.errors.searchFailed'), t('recommend:step8.errors.notAvailable'));
      return;
    }

    try {
      setSearching(true);
      geocoderRef.current.geocode({ address: searchQuery }, (results: any, status: any) => {
        // Reportar uso de Maps al backend para tracking
        reportMapsUsage('geocode');

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          mapRef.current.setCenter(location);
          mapRef.current.setZoom(15);
          markerRef.current.setPosition(location);
          markerRef.current.setVisible(true);

          onChange({
            latitud: lat,
            longitud: lng,
            nombre: results[0].address_components?.[0]?.long_name || searchQuery,
            direccion: results[0].formatted_address,
          });
          setSearchQuery('');
          setHasSearched(true);
          setAdjustmentUsed(false); // Reset para permitir 1 ajuste
        } else {
          Alert.alert(t('recommend:step8.noResults'), t('recommend:step8.tryAgain'));
        }
        setSearching(false);
      });
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert(t('recommend:step8.errors.searchFailed'), t('recommend:step8.tryAgain'));
      setSearching(false);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Este componente solo funciona en web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="map-marker-radius" 
          size={64} 
          color={colors.accent} 
        />
        
        <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {t('recommend:step8.title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {t('recommend:step8.subtitle')}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={[styles.searchInput, {
            backgroundColor: colors.bg,
            color: colors.text,
            borderColor: colors.accent,
            fontFamily: 'Lato-Regular',
          }]}
          placeholder={t('recommend:step8.searchPlaceholder')}
          placeholderTextColor={colors.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.accent }]}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <MaterialCommunityIcons name="magnify" size={22} color={colors.bg} />
          )}
        </TouchableOpacity>
      </View>

      {/* Indicador de ajuste - debajo del input */}
      {hasSearched && value.latitud && value.longitud && (
        <Text style={[
          styles.adjustmentText,
          { color: adjustmentUsed ? colors.secondary : colors.accent }
        ]}>
          {adjustmentUsed
            ? t('recommend:step8.adjustmentUsed')
            : t('recommend:step8.adjustmentAvailable')
          }
        </Text>
      )}

      <View style={styles.mapContainer}>
        {!mapLoaded && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>
              {t('recommend:step8.gettingLocation')}
            </Text>
          </View>
        )}
        
        <div 
          id="google-map" 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 12,
            opacity: mapLoaded ? 1 : 0,
          }}
        />
      </View>

      {value.latitud && value.longitud && (
        <View style={[styles.selectedContainer, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {value.nombre}
            </Text>
            <Text style={[styles.selectedAddress, { color: colors.secondary, fontFamily: 'Lato-Regular' }]} numberOfLines={2}>
              {value.direccion}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 12,
  },
  adjustmentText: {
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'Lato-Regular',
  },
});