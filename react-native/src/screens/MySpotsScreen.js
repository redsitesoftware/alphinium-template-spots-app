/**
 * MySpotsScreen — saved spots + spots the user pinned.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useSpotsStore } from '../store/spotsStore';
import { colors, spacing, radius, typography, shadows } from '../theme';

const CATEGORY_EMOJI = {
  beach: '🏖️', lookout: '🌄', hike: '🥾',
  cafe: '☕', fishing: '🎣', secret: '🤫',
};

function MiniSpotCard({ spot, onPress, onUnsave }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.cardEmoji}>{CATEGORY_EMOJI[spot.category] || '📍'}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
        <Text style={styles.cardMeta}>⭐ {spot.rating} · ❤️ {spot.saves} saves</Text>
      </View>
      <TouchableOpacity onPress={onUnsave} style={styles.unsaveBtn}>
        <Text style={styles.unsaveBtnText}>💔</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MySpotsScreen({ navigation }) {
  const { spots, savedSpots, mySpots, toggleSave } = useSpotsStore();
  const [tab, setTab] = useState('saved');

  const saved = spots.filter(s => savedSpots.includes(s.id));
  const pinned = spots.filter(s => mySpots.includes(s.id));
  const data = tab === 'saved' ? saved : pinned;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {[{ id: 'saved', label: '❤️ Saved' }, { id: 'pinned', label: '📍 My Pins' }].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{tab === 'saved' ? '🤍' : '📍'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'saved' ? 'No saved spots yet' : 'You haven\'t pinned any spots yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tab === 'saved'
                ? 'Tap �� on any spot to save it for later'
                : 'Tap + on the map to pin your first spot'}
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => navigation.navigate(tab === 'saved' ? 'Explore' : 'PinSpot')}
            >
              <Text style={styles.ctaBtnText}>
                {tab === 'saved' ? 'Browse Spots' : '📍 Pin a Spot'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <MiniSpotCard
            spot={item}
            onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
            onUnsave={() => toggleSave(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  tab: { flex: 1, paddingVertical: spacing.base, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: typography.base, fontWeight: typography.medium },
  tabTextActive: { color: colors.primary, fontWeight: typography.bold },
  list: { padding: spacing.base, gap: spacing.sm, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    padding: spacing.md, gap: spacing.md, ...shadows.sm,
  },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardName: { color: colors.textPrimary, fontSize: typography.base, fontWeight: typography.semibold },
  cardMeta: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  unsaveBtn: { padding: spacing.xs },
  unsaveBtnText: { fontSize: 20 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing['2xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: {
    color: colors.textPrimary, fontSize: typography.lg, fontWeight: typography.bold,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  emptySubtext: { color: colors.textMuted, fontSize: typography.sm, textAlign: 'center', marginBottom: spacing.xl },
  ctaBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: spacing['2xl'], paddingVertical: spacing.md,
  },
  ctaBtnText: { color: colors.white, fontWeight: typography.bold },
});
