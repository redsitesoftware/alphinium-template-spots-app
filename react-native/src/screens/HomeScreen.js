import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import axios from 'axios';
import { STRAPI_URL, STRAPI_API_TOKEN, APP_NAME } from '../config';
import AlphiniumNewsCard from '../components/AlphiniumNewsCard';
import { colors, typography, spacing, radius, shadows } from '../theme';

/**
 * HomeScreen — CMS News Feed
 * Fetches articles from the connected Strapi backend.
 * Accessed from Dashboard > CMS quick-action.
 *
 * Forge template: replace with your app's main content screen.
 */
export default function HomeScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!STRAPI_URL) return;
    fetchArticles();
  }, []);

  async function fetchArticles() {
    if (!STRAPI_URL) {
      setError('Backend not configured — set EXPO_PUBLIC_API_URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${STRAPI_URL}/api/articles`, {
        headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
      });
      setArticles(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }

  async function createArticle() {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Missing fields', 'Please enter both a title and content.');
      return;
    }
    setIsCreating(true);
    try {
      await axios.post(
        `${STRAPI_URL}/api/articles`,
        { data: { title: newTitle, content: newContent } },
        { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}`, 'Content-Type': 'application/json' } },
      );
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
      fetchArticles();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create article');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Unconfigured state ── */}
        {!STRAPI_URL && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⚙️</Text>
            <Text style={styles.emptyTitle}>Backend not configured</Text>
            <Text style={styles.emptyBody}>
              Set <Text style={styles.mono}>EXPO_PUBLIC_API_URL</Text> in your{' '}
              <Text style={styles.mono}>.env</Text> file to connect to your CMS.
            </Text>
          </View>
        )}

        {/* ── Error state ── */}
        {error && STRAPI_URL && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
            <TouchableOpacity onPress={fetchArticles}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Loading ── */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading articles…</Text>
          </View>
        )}

        {/* ── Articles ── */}
        {articles.map((article) => (
          <AlphiniumNewsCard
            key={article.id}
            article={article}
            style={styles.card}
            onPress={() =>
              Alert.alert(
                article.title || 'Article',
                article.content || '',
                [{ text: 'Close' }],
              )
            }
          />
        ))}

        {/* ── Empty ── */}
        {!loading && articles.length === 0 && STRAPI_URL && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No articles yet</Text>
            <Text style={styles.emptyBody}>Create the first article below.</Text>
          </View>
        )}

        {/* ── Refresh / Create buttons ── */}
        {STRAPI_URL && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchArticles} disabled={loading}>
              <Text style={styles.refreshBtnText}>↺  Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setShowCreate((v) => !v)}
            >
              <Text style={styles.createBtnText}>{showCreate ? '✕ Cancel' : '+ New Article'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Create form ── */}
        {showCreate && (
          <View style={styles.createForm}>
            <Text style={styles.createFormTitle}>New Article</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Content"
              placeholderTextColor={colors.textMuted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={createArticle}
              disabled={isCreating}
            >
              <Text style={styles.submitBtnText}>
                {isCreating ? 'Creating…' : 'Publish Article'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing['3xl'] },

  card: { marginBottom: spacing.md },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  mono: { color: colors.accent, fontFamily: 'monospace' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: { color: colors.error, fontSize: typography.sm, flex: 1 },
  errorRetry: { color: colors.primary, fontSize: typography.sm, fontWeight: typography.semibold },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: { color: colors.textMuted, fontSize: typography.sm },

  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  refreshBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  refreshBtnText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: typography.medium },
  createBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadows.glow,
  },
  createBtnText: { color: colors.white, fontSize: typography.sm, fontWeight: typography.bold },

  createForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  createFormTitle: {
    color: colors.textPrimary,
    fontSize: typography.md,
    fontWeight: typography.bold,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.base,
  },
  textarea: { height: 100 },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitBtnText: { color: colors.textInverse, fontSize: typography.base, fontWeight: typography.bold },
});
