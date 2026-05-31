import React from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { useAuth } from '@alphinium/auth';
import { isProjectAdmin } from '../utils/admin';

/**
 * AlphiniumAddonsScreen
 * Shows available Alphinium add-on packages.
 * Only lists addons that are actually built and working.
 */

const ADDONS = [
  {
    id: 'alphinium-auth',
    name: '@alphinium/auth',
    emoji: '🔐',
    tagline: 'Authentication',
    description: 'Email + password and social login (Google, Apple, GitHub). AuthContext, useAuth hook, protected routes — included in every forge project.',
    status: 'core',
    docsUrl: 'https://github.com/redsitesoftware/alphinium-auth#readme',
  },
  {
    id: 'alphinium-payments',
    name: '@alphinium/payments',
    emoji: '💳',
    tagline: 'Stripe Billing',
    description: 'Stripe subscription plans, billing portal, webhook lifecycle — included in every forge project.',
    status: 'core',
    docsUrl: 'https://github.com/redsitesoftware/alphinium-payments#readme',
  },
  {
    id: 'alphinium-ads',
    name: '@alphinium/ads',
    emoji: '📢',
    tagline: 'AdMob Monetization',
    description: 'Banner, interstitial, and rewarded video ads via Google AdMob. Mock mode works immediately — real ads require your AdMob account.',
    status: 'ready',
    install: 'npm install github:redsitesoftware/alphinium-ads',
    docsUrl: 'https://github.com/redsitesoftware/alphinium-ads#readme',
  },
  {
    id: 'alphinium-analytics',
    name: '@alphinium/analytics',
    emoji: '📊',
    tagline: 'Privacy-safe Analytics',
    description: 'Self-hosted analytics — pageviews, unique visitors, events, real-time. No cookies, no consent banners. Deploy your own collector pod.',
    status: 'ready',
    install: 'npm install github:redsitesoftware/alphinium-analytics',
    docsUrl: 'https://github.com/redsitesoftware/alphinium-analytics#readme',
  },
  {
    id: 'alphinium-ai',
    name: '@alphinium/ai',
    emoji: '🤖',
    tagline: 'AI Chat Widget',
    description: 'Embed a ChatInstance-powered AI chat assistant into your app. Floating button + full chat UI. Backed by alphinium\'s Dolphin/Ollama cluster — no API keys or Copilot subscription needed.',
    status: 'ready',
    install: 'bash <(curl -fsSL https://raw.githubusercontent.com/redsitesoftware/alphinium-ai/main/install.sh)',
    docsUrl: 'https://github.com/redsitesoftware/alphinium-ai#readme',
  },
];

const STATUS_CONFIG = {
  core:  { label: '✓ core',  bg: '#0d2f0d', border: '#4CAF50', text: '#4CAF50' },
  ready: { label: '✓ ready', bg: '#0d1f3a', border: '#4285F4', text: '#4285F4' },
};

export default function AlphiniumAddonsScreen() {
  const { user } = useAuth();
  const coreAddons  = ADDONS.filter(a => a.status === 'core');
  const readyAddons = ADDONS.filter(a => a.status === 'ready');

  if (!isProjectAdmin(user)) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateEmoji}>🔒</Text>
        <Text style={styles.gateTitle}>Admin only</Text>
        <Text style={styles.gateText}>Add-on management is restricted to administrators.</Text>
      </View>
    );
  }

  function renderAddon(addon) {
    const cfg = STATUS_CONFIG[addon.status];
    return (
      <View key={addon.id} style={[styles.card, { borderColor: cfg.border }]}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardEmoji}>{addon.emoji}</Text>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardName}>{addon.name}</Text>
            <Text style={styles.cardTagline}>{addon.tagline}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>{addon.description}</Text>

        {addon.install && (
          <View style={styles.snippet}>
            <Text style={styles.snippetText}>{addon.install}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.docsBtn}
          onPress={() => Linking.openURL(addon.docsUrl)}
        >
          <Text style={styles.docsBtnText}>📄 View Docs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderSection(title, addons) {
    if (!addons.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {addons.map(renderAddon)}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📦 Alphinium Add-ons</Text>
        <Text style={styles.subtitle}>
          Add-on packages for your forge project.{'\n'}
          Setup guides: react-native/ADDONS.md
        </Text>
      </View>

      {renderSection('Core — included in every project', coreAddons)}
      {renderSection('Optional — install when needed', readyAddons)}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          More add-ons coming soon · github.com/redsitesoftware
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e27' },
  content: { paddingBottom: 48 },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8b9dc3', textAlign: 'center', lineHeight: 22 },
  section: { marginTop: 8, marginBottom: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5b74',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardEmoji: { fontSize: 26, marginRight: 12, marginTop: 2 },
  cardTitleBlock: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'monospace' },
  cardTagline: { fontSize: 12, color: '#8b9dc3', marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { color: '#b4c1d8', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  snippet: {
    backgroundColor: '#0a1628',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e3050',
  },
  snippetText: { color: '#8b9dc3', fontSize: 12, fontFamily: 'monospace' },
  docsBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#12193a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a3550',
  },
  docsBtnText: { color: '#8b9dc3', fontSize: 13, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { color: '#4b5b74', fontSize: 12 },
  gateContainer: {
    flex: 1,
    backgroundColor: '#0a0e27',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  gateEmoji: { fontSize: 48, marginBottom: 16 },
  gateTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  gateText: { fontSize: 14, color: '#8b9dc3', textAlign: 'center', lineHeight: 22 },
});
