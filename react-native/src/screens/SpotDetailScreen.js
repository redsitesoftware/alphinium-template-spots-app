/**
 * SpotDetailScreen — full detail view for a single spot.
 */
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Share, Alert,
} from 'react-native';
import { useSpotsStore } from '../store/spotsStore';
import { colors, spacing, radius, typography, shadows } from '../theme';

const CATEGORY_EMOJI = {
  beach: '🏖️', lookout: '🌄', hike: '🥾',
  cafe: '☕', fishing: '🎣', secret: '🤫',
};

const CATEGORY_LABEL = {
  beach: 'Beach', lookout: 'Lookout', hike: 'Hike',
  cafe: 'Cafe', fishing: 'Fishing', secret: 'Secret Spot',
};

export default function SpotDetailScreen({ route, navigation }) {
  const { spotId } = route.params;
  const { getSpotById, toggleSave, isSaved } = useSpotsStore();
  const spot = getSpotById(spotId);

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Spot not found</Text>
      </SafeAreaView>
    );
  }

  const saved = isSaved(spot.id);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this spot: ${spot.name}\n\n${spot.description}\n\nShared via Spots app`,
        title: spot.name,
      });
    } catch (_) {}
  };

  const handleCheckin = () => {
    Alert.alert('✅ Checked In!', `You've checked in at ${spot.name}. Thanks for verifying this spot!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>
            {CATEGORY_EMOJI[spot.category] || '📍'}
          </Text>
          <View style={styles.heroOverlay}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{CATEGORY_LABEL[spot.category] || spot.category}</Text>
            </View>
          </View>
        </View>

        {/* Header */}
        <View style={styles.section}>
          <View style={styles.nameRow}>
            <Text style={styles.spotName}>{spot.name}</Text>
            <TouchableOpacity onPress={() => toggleSave(spot.id)} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>{saved ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pinnedBy}>Pinned by {spot.pinnedBy} · {spot.pinnedAt}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>⭐ {spot.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>❤️ {spot.saves}</Text>
              <Text style={styles.statLabel}>Saves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>📌 {spot.checkins}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this spot</Text>
          <Text style={styles.description}>{spot.description}</Text>
        </View>

        {/* Tips */}
        {spot.tips ? (
          <View style={styles.tipsBox}>
            <Text style={styles.tipsIcon}>💡</Text>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Insider Tips</Text>
              <Text style={styles.tipsText}>{spot.tips}</Text>
            </View>
          </View>
        ) : null}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.coordBox}>
            <Text style={styles.coordText}>
              🧭 {spot.lat.toFixed(4)}°, {spot.lng.toFixed(4)}°
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {spot.tags.map(t => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}># {t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCheckin}>
            <Text style={styles.actionBtnText}>📌 Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleShare}>
            <Text style={styles.actionBtnTextSecondary}>↗️ Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  hero: {
    height: 180, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  heroEmoji: { fontSize: 80 },
  heroOverlay: {
    position: 'absolute', bottom: spacing.base, left: spacing.base,
  },
  categoryChip: {
    backgroundColor: colors.primary + 'CC', paddingHorizontal: spacing.md,
    paddingVertical: 4, borderRadius: radius.full,
  },
  categoryChipText: { color: colors.white, fontSize: typography.xs, fontWeight: typography.bold },
  section: { padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  spotName: {
    flex: 1, color: colors.textPrimary, fontSize: typography['2xl'],
    fontWeight: typography.heavy, marginRight: spacing.sm, lineHeight: 34,
  },
  saveBtn: { padding: spacing.xs },
  saveBtnText: { fontSize: 28 },
  pinnedBy: { color: colors.textMuted, fontSize: typography.sm, marginTop: 4, marginBottom: spacing.base },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { color: colors.textPrimary, fontSize: typography.base, fontWeight: typography.bold },
  statLabel: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.surfaceBorder },
  sectionTitle: {
    color: colors.textSecondary, fontSize: typography.sm,
    fontWeight: typography.semibold, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  description: { color: colors.textPrimary, fontSize: typography.base, lineHeight: 24 },
  tipsBox: {
    flexDirection: 'row', margin: spacing.base,
    backgroundColor: colors.warningBg || 'rgba(244,162,97,0.12)',
    borderRadius: radius.lg, padding: spacing.base,
    borderWidth: 1, borderColor: colors.accent + '44',
  },
  tipsIcon: { fontSize: 22, marginRight: spacing.sm },
  tipsContent: { flex: 1 },
  tipsTitle: {
    color: colors.accent, fontSize: typography.sm,
    fontWeight: typography.bold, marginBottom: 4,
  },
  tipsText: { color: colors.textSecondary, fontSize: typography.sm, lineHeight: 20 },
  coordBox: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  coordText: { color: colors.textMuted, fontSize: typography.sm, fontFamily: 'monospace' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  tagText: { color: colors.textSecondary, fontSize: typography.xs },
  actionRow: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.base, paddingTop: spacing['2xl'],
  },
  actionBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.base,
    alignItems: 'center', ...shadows.md,
  },
  actionBtnText: { color: colors.white, fontSize: typography.base, fontWeight: typography.bold },
  actionBtnSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  actionBtnTextSecondary: { color: colors.textPrimary, fontSize: typography.base, fontWeight: typography.bold },
  errorText: { color: colors.error, padding: spacing.base },
});
