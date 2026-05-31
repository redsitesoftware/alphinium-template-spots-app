/**
 * SpotsListScreen — scrollable card list of spots.
 */
import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useSpotsStore, CATEGORIES } from '../store/spotsStore';
import { colors, spacing, radius, typography, shadows } from '../theme';

const CATEGORY_EMOJI = {
  beach: '🏖️', lookout: '🌄', hike: '🥾',
  cafe: '☕', fishing: '🎣', secret: '🤫',
};

const CATEGORY_COLOR = {
  beach: colors.categoryBeach ?? '#4DA6FF',
  lookout: '#F4A261',
  hike: '#52B788',
  cafe: '#D4A373',
  fishing: '#4ECDC4',
  secret: '#A855F7',
};

function SpotCard({ spot, saved, onPress, onSave }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.categoryBadge, { backgroundColor: (CATEGORY_COLOR[spot.category] || colors.primary) + '22' }]}>
        <Text style={[styles.categoryEmoji]}>{CATEGORY_EMOJI[spot.category] || '📍'}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
          <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.saveBtn}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{spot.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>⭐ {spot.rating}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>❤️ {spot.saves}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>📌 {spot.checkins} visits</Text>
        </View>
        <View style={styles.tagRow}>
          {spot.tags.slice(0, 3).map(t => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SpotsListScreen({ navigation }) {
  const { filteredSpots, activeCategory, setCategory, toggleSave, isSaved } = useSpotsStore();
  const spots = filteredSpots();

  return (
    <SafeAreaView style={styles.container}>
      {/* Category filter */}
      <View style={styles.filterRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, activeCategory === cat.id && styles.pillActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={[styles.pillText, activeCategory === cat.id && styles.pillTextActive]}>
              {cat.emoji} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={spots}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.header}>{spots.length} spots found</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyText}>No spots found</Text>
            <Text style={styles.emptySubtext}>Try a different filter or search</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SpotCard
            spot={item}
            saved={isSaved(item.id)}
            onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
            onSave={() => toggleSave(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm, gap: spacing.sm, flexWrap: 'nowrap',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.textSecondary, fontSize: typography.xs, fontWeight: typography.medium },
  pillTextActive: { color: colors.white },
  list: { padding: spacing.base, gap: spacing.md, paddingBottom: 80 },
  header: { color: colors.textMuted, fontSize: typography.sm, marginBottom: spacing.xs },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder,
    overflow: 'hidden', ...shadows.md,
  },
  categoryBadge: {
    width: 56, alignItems: 'center', justifyContent: 'center', padding: spacing.sm,
  },
  categoryEmoji: { fontSize: 24 },
  cardBody: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: {
    flex: 1, color: colors.textPrimary, fontSize: typography.base,
    fontWeight: typography.bold, marginRight: spacing.sm,
  },
  saveBtn: { fontSize: 18 },
  cardDesc: {
    color: colors.textSecondary, fontSize: typography.sm,
    lineHeight: 18, marginTop: 4, marginBottom: spacing.sm,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  metaText: { color: colors.textMuted, fontSize: typography.xs },
  metaDot: { color: colors.textMuted, fontSize: typography.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  tagText: { color: colors.textMuted, fontSize: 10 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: typography.bold },
  emptySubtext: { color: colors.textMuted, fontSize: typography.sm, marginTop: spacing.xs },
});
