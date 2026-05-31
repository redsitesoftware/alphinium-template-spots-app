/**
 * PinSpotScreen — form to add a new spot to the map.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSpotsStore, CATEGORIES } from '../store/spotsStore';
import { colors, spacing, radius, typography, shadows } from '../theme';

const CATEGORY_EMOJI = {
  beach: '🏖️', lookout: '🌄', hike: '🥾',
  cafe: '☕', fishing: '🎣', secret: '🤫',
};

export default function PinSpotScreen({ navigation }) {
  const { addSpot } = useSpotsStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('beach');
  const [description, setDescription] = useState('');
  const [tips, setTips] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Name required', 'Give your spot a name.'); return; }
    if (!description.trim()) { Alert.alert('Description required', 'Describe what makes this spot special.'); return; }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Location required', 'Enter valid latitude and longitude coordinates.');
      return;
    }

    setSaving(true);
    const newSpot = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      lat: latNum,
      lng: lngNum,
      description: description.trim(),
      tips: tips.trim(),
      rating: 0,
      saves: 0,
      checkins: 0,
      pinnedBy: 'You',
      pinnedAt: 'Just now',
      tags: tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      photos: [],
    };

    setTimeout(() => {
      addSpot(newSpot);
      setSaving(false);
      Alert.alert('📍 Spot Pinned!', `${newSpot.name} has been added to the map.`, [
        { text: 'View on Map', onPress: () => navigation.navigate('Map') },
        { text: 'View Spot', onPress: () => navigation.navigate('SpotDetail', { spotId: newSpot.id }) },
      ]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>📍 Pin a Spot</Text>
          <Text style={styles.pageSubtitle}>Share a location only you know about</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Spot Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Secret Coogee Cove"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, category === cat.id && styles.catChipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="What makes this spot special? What will people find here?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={400}
            />
            <Text style={styles.charCount}>{description.length}/400</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Insider Tips</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={tips}
              onChangeText={setTips}
              placeholder="Best time to go, what to bring, any warnings..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location *</Text>
            <Text style={styles.labelHint}>Find coordinates in Google Maps: long-press → tap the coords</Text>
            <View style={styles.coordRow}>
              <TextInput
                style={[styles.input, styles.coordInput]}
                value={lat}
                onChangeText={setLat}
                placeholder="Latitude e.g. -33.87"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.coordInput]}
                value={lng}
                onChangeText={setLng}
                placeholder="Longitude e.g. 151.21"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="hidden, dog-friendly, sunrise (comma separated)"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Pinning...' : '📍 Pin This Spot'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base, paddingBottom: 60 },
  pageTitle: {
    color: colors.textPrimary, fontSize: typography['2xl'],
    fontWeight: typography.heavy, marginBottom: 4,
  },
  pageSubtitle: { color: colors.textMuted, fontSize: typography.sm, marginBottom: spacing['2xl'] },
  field: { marginBottom: spacing.lg },
  label: {
    color: colors.textSecondary, fontSize: typography.sm,
    fontWeight: typography.semibold, marginBottom: spacing.sm,
  },
  labelHint: { color: colors.textMuted, fontSize: typography.xs, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.lg, padding: spacing.md, color: colors.textPrimary,
    fontSize: typography.base,
  },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'right', marginTop: 4 },
  coordRow: { flexDirection: 'row', gap: spacing.sm },
  coordInput: { flex: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catEmoji: { fontSize: 16 },
  catLabel: { color: colors.textSecondary, fontSize: typography.sm },
  catLabelActive: { color: colors.white, fontWeight: typography.semibold },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.base + 2, alignItems: 'center',
    marginTop: spacing.xl, ...shadows.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: typography.base, fontWeight: typography.bold },
});
