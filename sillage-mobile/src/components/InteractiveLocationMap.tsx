import React, { useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeProvider';

interface InteractiveLocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  interactive?: boolean;
}

export const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  latitude,
  longitude,
  zoom = 14,
  onLocationSelect,
  interactive = true,
}) => {
  const { colors } = useTheme();
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick' && onLocationSelect) {
        const { lat, lng } = data;
        
        // Obtener dirección del punto clickeado
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const result = await response.json();
          const address = result.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onLocationSelect(lat, lng, address);
        } catch (error) {
          console.error('Error obteniendo dirección:', error);
          onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      }
    } catch (error) {
      console.error('Error procesando mensaje del mapa:', error);
    }
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Mapa Interactivo</title>
  
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    
    #map {
      width: 100vw;
      height: 100vh;
      cursor: ${interactive ? 'crosshair' : 'grab'};
    }
    
    .leaflet-container {
      background: #1a1a1a;
    }
    
    .custom-marker {
      background-color: ${colors.accent};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .custom-marker::after {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: white;
      transform: rotate(45deg);
    }
    
    .info-box {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      font-size: 13px;
      color: #333;
      font-weight: 600;
      max-width: 90%;
      text-align: center;
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
    
    @keyframes slideDown {
      to {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  ${interactive ? '<div class="info-box">👆 Toca el mapa para seleccionar una ubicación</div>' : ''}
  
  <script>
    const map = L.map('map', {
      center: [${latitude}, ${longitude}],
      zoom: ${zoom},
      zoomControl: true,
      attributionControl: true,
    });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    
    let marker = null;
    
    function createCustomMarker(lat, lng) {
      const icon = L.divIcon({
        className: 'custom-marker-wrapper',
        html: '<div class="custom-marker"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng], { icon }).addTo(map);
      }
    }
    
    createCustomMarker(${latitude}, ${longitude});
    
    ${interactive ? `
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      createCustomMarker(lat, lng);
      
      map.flyTo([lat, lng], Math.max(map.getZoom(), 15), {
        duration: 0.8,
        easeLinearity: 0.5
      });
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapClick',
        lat: lat,
        lng: lng
      }));
    });
    ` : ''}
    
    L.control.scale({
      imperial: false,
      metric: true
    }).addTo(map);
    
    ${interactive ? `
    setTimeout(() => {
      const infoBox = document.querySelector('.info-box');
      if (infoBox) {
        infoBox.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => infoBox.remove(), 300);
      }
    }, 4000);
    ` : ''}
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {!mapLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            Cargando mapa...
          </Text>
        </View>
      )}
      
      <WebView
        source={{ html: htmlContent }}
        style={[styles.webview, { opacity: mapLoaded ? 1 : 0 }]}
        onLoadEnd={() => setMapLoaded(true)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
});