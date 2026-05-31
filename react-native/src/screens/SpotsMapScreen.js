/**
 * SpotsMapScreen — interactive Leaflet map via WebView (native) or react-leaflet (web).
 * Shows all spots as coloured pins. Tap a pin → SpotDetail.
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  Text, ActivityIndicator, Platform,
} from 'react-native';
import MapWebView from '../components/MapWebView';
import { useSpotsStore, CATEGORIES } from '../store/spotsStore';
import { colors, spacing, radius, typography, shadows } from '../theme';

// Web uses react-leaflet directly; native uses WebView+iframe
let SpotsLeafletMap = null;
if (Platform.OS === 'web') {
  SpotsLeafletMap = require('../components/SpotsLeafletMap.web').default;
}

const PIN_COLORS = {
  beach:   '#4DA6FF',
  lookout: '#F4A261',
  hike:    '#52B788',
  cafe:    '#D4A373',
  fishing: '#4ECDC4',
  secret:  '#A855F7',
  default: '#2D6A4F',
};

function buildMapHTML(spots) {
  const spotsJson = JSON.stringify(spots.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    lat: s.lat,
    lng: s.lng,
    rating: s.rating,
    saves: s.saves,
    color: PIN_COLORS[s.category] || PIN_COLORS.default,
  })));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; background:#0F1A0F; }
  .spot-pin {
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    cursor: pointer;
  }
  .leaflet-popup-content-wrapper {
    background: #162416; color: #fff;
    border-radius: 12px; border: 1px solid #2A422A;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  .leaflet-popup-tip { background: #162416; }
  .popup-name { font-size:15px; font-weight:700; color:#fff; margin-bottom:4px; }
  .popup-meta { font-size:12px; color:#A8C5A0; margin-bottom:8px; }
  .popup-btn {
    background:#2D6A4F; color:#fff; border:none; border-radius:8px;
    padding:8px 16px; width:100%; font-size:13px; font-weight:600;
    cursor:pointer; margin-top:4px;
  }
  .popup-btn:active { background:#40916C; }
</style>
</head>
<body>
<div id="map"></div>
<script>
var spots = ${spotsJson};

var map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
}).setView([-33.87, 151.21], 10);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

spots.forEach(function(spot) {
  var icon = L.divIcon({
    className: '',
    html: '<div class="spot-pin" style="background:' + spot.color + '"></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

  var marker = L.marker([spot.lat, spot.lng], { icon: icon }).addTo(map);

  var popup = L.popup({ maxWidth: 220, minWidth: 200 }).setContent(
    '<div class="popup-name">' + spot.name + '</div>' +
    '<div class="popup-meta">&#11088; ' + spot.rating + ' &middot; ' + spot.saves + ' saves</div>' +
    '<button class="popup-btn" onclick="selectSpot(\'' + spot.id + '\')">View Spot &#8594;</button>'
  );

  marker.bindPopup(popup);
});

function selectSpot(id) {
  var msg = JSON.stringify({ type: 'SELECT_SPOT', id: id });
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  } else {
    window.parent.postMessage(msg, '*');
  }
}

map.on('click', function() {
  var msg = JSON.stringify({ type: 'MAP_CLICK' });
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(msg);
  } else {
    window.parent.postMessage(msg, '*');
  }
});
</script>
</body>
</html>`;
}

export default function SpotsMapScreen({ navigation }) {
  const webRef = useRef(null);
  const { spots, filteredSpots, setSearch, searchQuery, activeCategory, setCategory } = useSpotsStore();
  const [mapReady, setMapReady] = useState(false);

  const allSpots = filteredSpots();
  const mapHtml = buildMapHTML(allSpots);

  const handleMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SELECT_SPOT') {
        navigation.navigate('SpotDetail', { spotId: msg.id });
      }
    } catch (_) {}
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search spots..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter pills */}
      <View style={styles.filterRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={styles.pillText}>{cat.emoji} {cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {!mapReady && (
          <View style={styles.mapLoader}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.mapLoaderText}>Loading map...</Text>
          </View>
        )}
        {SpotsLeafletMap ? (
          <SpotsLeafletMap
            spots={allSpots}
            onSelectSpot={(id) => navigation.navigate('SpotDetail', { spotId: id })}
            onReady={() => setMapReady(true)}
            style={styles.map}
          />
        ) : (
          <MapWebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
            onLoad={() => setMapReady(true)}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Spot count */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          📍 {allSpots.length} spot{allSpots.length !== 1 ? 's' : ''} on map
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SpotsList')}>
          <Text style={styles.listBtn}>List view →</Text>
        </TouchableOpacity>
      </View>

      {/* FAB — pin a new spot */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PinSpot')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  searchInput: {
    flex: 1, color: colors.textPrimary,
    fontSize: typography.base, paddingVertical: spacing.md,
  },
  clearBtn: { color: colors.textMuted, fontSize: 14, padding: 4 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm, gap: spacing.sm, flexWrap: 'nowrap',
  },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  pillActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  pillText: { color: colors.textPrimary, fontSize: typography.xs, fontWeight: typography.semibold },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1, backgroundColor: colors.background },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  mapLoaderText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: typography.sm },
  countBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
  },
  countText: { color: colors.textSecondary, fontSize: typography.sm },
  listBtn: { color: colors.primary, fontSize: typography.sm, fontWeight: typography.semibold },
  fab: {
    position: 'absolute', bottom: 72, right: spacing.base,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.lg,
  },
  fabText: { color: colors.white, fontSize: 28, lineHeight: 30, marginTop: -2 },
});
