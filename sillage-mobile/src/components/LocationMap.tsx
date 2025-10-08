import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, Image, TouchableOpacity, Linking, Text } from 'react-native';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  onOpenExternal?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_SCRIPT_ID = 'leaflet-js';
const LEAFLET_STYLES_ID = 'leaflet-css';
const LEAFLET_VERSION = '1.9.4';

const ensureLeafletStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LEAFLET_STYLES_ID)) {
    return;
  }

  const link = document.createElement('link');
  link.id = LEAFLET_STYLES_ID;
  link.rel = 'stylesheet';
  link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
};

const ensureLeafletScript = (): Promise<any> => {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Leaflet only available in browser environments.'));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  ensureLeafletStyles();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = LEAFLET_SCRIPT_ID;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.integrity = 'sha256-gZ5Jd8z44Q0EMsVG0BcwP/d1CChE0iUWa2bUCh+oC4Q=';
    script.crossOrigin = '';
    script.onload = () => {
      if (window.L?.Icon?.Default) {
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png`,
          iconUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png`,
          shadowUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png`,
        });
      }
      resolve(window.L);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  zoom = 14,
  onOpenExternal,
}) => {
  const safeZoom = clamp(zoom, 3, 18);

  const mapElementRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [webMapReady, setWebMapReady] = useState(false);
  const [webMapFailed, setWebMapFailed] = useState(false);
  const latestPositionRef = useRef({ latitude, longitude, zoom: safeZoom });

  useEffect(() => {
    latestPositionRef.current = { latitude, longitude, zoom: safeZoom };
  }, [latitude, longitude, safeZoom]);

  const staticMapUrl = useMemo(() => {
    const roundedLat = latitude.toFixed(6);
    const roundedLon = longitude.toFixed(6);
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${roundedLat},${roundedLon}&zoom=${safeZoom}&size=800x450&markers=${roundedLat},${roundedLon},lightblue1`;
  }, [latitude, longitude, safeZoom]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    let cancelled = false;
    let mapInstance: any = null;

    const mountMap = async () => {
      try {
        const leaflet = await ensureLeafletScript();
        if (cancelled) {
          return;
        }

        const container = mapElementRef.current as HTMLDivElement | null;
        if (!container) {
          return;
        }

        container.innerHTML = '';

        mapInstance = leaflet.map(container, {
          center: [latitude, longitude],
          zoom: safeZoom,
          zoomControl: true,
          attributionControl: false,
        });

        leaflet
          .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            crossOrigin: true,
          })
          .addTo(mapInstance);

        const { latitude: lat, longitude: lon, zoom: zoomLevel } = latestPositionRef.current;

        const marker = leaflet
          .marker([lat, lon], { keyboard: false })
          .addTo(mapInstance);

        mapInstance.setView([lat, lon], zoomLevel);

        mapInstanceRef.current = mapInstance;
        markerRef.current = marker;
        if (!cancelled) {
          setWebMapReady(true);
        }
      } catch (error) {
        // Ignore script loading errors silently to avoid breaking the rest of the UI.
        if (!cancelled) {
          setWebMapFailed(true);
        }
      }
    };

    setWebMapReady(false);
    setWebMapFailed(false);
    mountMap();

    return () => {
      cancelled = true;
      mapInstance?.remove?.();
      mapInstanceRef.current?.remove?.();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    const leaflet = window.L;

    if (map && leaflet) {
      map.setView([latitude, longitude], safeZoom);
      if (marker) {
        marker.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = leaflet.marker([latitude, longitude], { keyboard: false }).addTo(map);
      }
    }
  }, [latitude, longitude, safeZoom]);

  if (Platform.OS === 'web') {
    if (webMapFailed) {
      return (
        <TouchableOpacity activeOpacity={0.88} style={styles.webFallback} onPress={handleOpenExternal}>
          <Image source={{ uri: staticMapUrl }} style={styles.mapImage} resizeMode="cover" />
          <View style={styles.webFallbackOverlay} pointerEvents="none">
            <Text style={styles.webFallbackText}>Abrir mapa interactivo en una pestaña nueva</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.webContainer}>
        <View ref={mapElementRef} style={styles.webMapSurface} />
        {!webMapReady && (
          <View style={styles.webLoadingOverlay} pointerEvents="none">
            <Text style={styles.webLoadingText}>Cargando mapa...</Text>
          </View>
        )}
      </View>
    );
  }

  const handleOpenExternal = () => {
    const externalUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${safeZoom}/${latitude}/${longitude}`;
    Linking.openURL(externalUrl).catch(() => {
      // No action needed if the device cannot open the link
    });
    onOpenExternal?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.mobileContainer}
      onPress={handleOpenExternal}
    >
      <Image source={{ uri: staticMapUrl }} style={styles.mapImage} resizeMode="cover" />
      <View style={styles.mobileOverlay} pointerEvents="none">
        <Text style={styles.overlayText}>Toca para abrir el mapa interactivo</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
    position: 'relative',
  },
  webMapSurface: {
    width: '100%',
    height: '100%',
  },
  webLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.72)',
    paddingHorizontal: 16,
  },
  webLoadingText: {
    color: '#F5F5F5',
    fontSize: 14,
    textAlign: 'center',
  },
  webFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
    position: 'relative',
  },
  webFallbackOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  webFallbackText: {
    color: '#F5F5F5',
    fontSize: 13,
    textAlign: 'center',
  },
  mobileContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mobileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayText: {
    color: '#F5F5F5',
    fontSize: 12,
    textAlign: 'center',
  },
});
