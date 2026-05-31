/**
 * SpotsLeafletMap.web.js — Web-only Leaflet map using react-leaflet.
 * Replaces the iframe/WebView approach for the web platform.
 */
import React, { useEffect } from 'react';

const PIN_COLORS = {
  beach:   '#4DA6FF',
  lookout: '#F4A261',
  hike:    '#52B788',
  cafe:    '#D4A373',
  fishing: '#4ECDC4',
  secret:  '#A855F7',
  default: '#2D6A4F',
};

let MapContainer, TileLayer, Marker, Popup, useMap, L;

function LoadLeaflet() {
  // Inject Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);
  return null;
}

// Lazy-load react-leaflet (not available on native)
let reactLeaflet = null;
let leafletLib = null;
try {
  reactLeaflet = require('react-leaflet');
  leafletLib = require('leaflet');
  MapContainer = reactLeaflet.MapContainer;
  TileLayer = reactLeaflet.TileLayer;
  Marker = reactLeaflet.Marker;
  Popup = reactLeaflet.Popup;
  useMap = reactLeaflet.useMap;
  L = leafletLib.default || leafletLib;

  // Fix default marker icon paths (webpack/metro asset issue)
  if (L && L.Icon && L.Icon.Default) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
} catch (_) {}

function createPinIcon(color) {
  if (!L) return null;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px; height:32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: ${color};
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });
}

function SpotMarkers({ spots, onSelectSpot }) {
  if (!Marker || !Popup) return null;
  return spots.map(spot => {
    const color = PIN_COLORS[spot.category] || PIN_COLORS.default;
    const icon = createPinIcon(color);
    return (
      <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={icon}>
        <Popup>
          <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 180 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{spot.name}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              ⭐ {spot.rating} · {spot.saves} saves
            </div>
            <button
              onClick={() => onSelectSpot(spot.id)}
              style={{
                background: '#2D6A4F', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', width: '100%',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              View Spot →
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default function SpotsLeafletMap({ spots = [], onSelectSpot, onReady, style }) {
  if (!MapContainer || !TileLayer) {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F1A0F', color: '#52B788' }}>
        Map unavailable
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <LoadLeaflet />
      <MapContainer
        center={[-33.87, 151.21]}
        zoom={10}
        style={{ width: '100%', height: '100%', background: '#0F1A0F' }}
        zoomControl={false}
        attributionControl={false}
        whenReady={onReady}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <SpotMarkers spots={spots} onSelectSpot={onSelectSpot || (() => {})} />
      </MapContainer>
    </div>
  );
}
