import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import AppWebView from '../components/AppWebView';
import { STRAPI_URL, APP_NAME, OAUTH_PROVIDERS } from '../config';
import { useAuth } from '@alphinium/auth';
import { colors, typography, spacing, radius, shadows } from '../theme';

const ALL_PROVIDERS = [
  { id: 'github',   label: 'Continue with GitHub',   emoji: '🐙', bg: '#24292e', border: '#3d444d' },
  { id: 'google',   label: 'Continue with Google',   emoji: '🔵', bg: '#4285F4', border: '#3367D6' },
  { id: 'facebook', label: 'Continue with Facebook', emoji: '👤', bg: '#1877F2', border: '#1464CC' },
];

const SOCIAL_PROVIDERS = ALL_PROVIDERS.filter((p) => OAUTH_PROVIDERS.includes(p.id));
const SHOW_EMAIL = OAUTH_PROVIDERS.includes('email');

export default function LoginScreen({ navigation, onLoginSuccess, onGuestAccess }) {
  const { login } = useAuth();
  const [showWebView, setShowWebView] = useState(false);
  const [oauthUrl, setOauthUrl] = useState('');
  const [notice, setNotice] = useState('');

  function showNotice(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  }

  async function handleSocialLogin(providerName) {
    if (!STRAPI_URL) {
      showNotice('No backend configured — set EXPO_PUBLIC_API_URL to enable login.');
      return;
    }
    setOauthUrl(`${STRAPI_URL}/api/connect/${providerName}`);
    setShowWebView(true);
  }

  function handleNavigationStateChange(navState) {
    const url = navState.url;
    if (url.includes('/auth/success') || url.includes('access_token=')) {
      try {
        const token = new URL(url).searchParams.get('access_token');
        if (token) {
          login?.(token);
          onLoginSuccess?.(token);
          setShowWebView(false);
          navigation?.goBack();
        }
      } catch (e) {
        console.error('OAuth callback parse error:', e);
      }
    } else if (url.includes('/auth/failure') || url.includes('error=')) {
      setShowWebView(false);
      showNotice('Login failed. Please try again.');
    }
  }

  if (showWebView) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TouchableOpacity
          style={styles.webviewClose}
          onPress={() => setShowWebView(false)}
        >
          <Text style={styles.webviewCloseText}>✕ Cancel</Text>
        </TouchableOpacity>
        <AppWebView
          source={{ uri: oauthUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onError={() => {
            setShowWebView(false);
            showNotice('Login failed. Please try again.');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Back button */}
          {navigation?.canGoBack?.() && (
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
          )}

          {/* Branding */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>📍</Text>
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Discover & share secret spots</Text>
          </View>

          {/* Inline notice (replaces Alert.alert on web) */}
          {!!notice && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {/* Social buttons */}
          <View style={styles.buttons}>
            {SOCIAL_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[styles.providerBtn, { backgroundColor: provider.bg, borderColor: provider.border }]}
                onPress={() => handleSocialLogin(provider.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.providerEmoji}>{provider.emoji}</Text>
                <Text style={styles.providerLabel}>{provider.label}</Text>
              </TouchableOpacity>
            ))}

            {SHOW_EMAIL && (
              <>
                {SOCIAL_PROVIDERS.length > 0 && (
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.emailBtn}
                  onPress={() => showNotice('Email login coming soon.')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.emailBtnText}>✉️  Sign in with Email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Guest / demo bypass — shown when no backend is configured */}
            {!STRAPI_URL && !!onGuestAccess && (
              <TouchableOpacity style={styles.guestBtn} onPress={onGuestAccess} activeOpacity={0.75}>
                <Text style={styles.guestBtnText}>Explore without signing in →</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.terms}>
            By signing in you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    justifyContent: 'center',
  },
  back: { position: 'absolute', top: spacing.xl, left: spacing.xl },
  backText: { color: colors.primary, fontSize: typography.base, fontWeight: typography.semibold },

  // Brand
  brand: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
    ...shadows.glow,
  },
  logoEmoji: { fontSize: 38 },
  appName: {
    color: colors.textPrimary,
    fontSize: typography['2xl'],
    fontWeight: typography.heavy,
    marginBottom: spacing.xs,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: typography.base,
  },

  // Buttons
  buttons: { gap: spacing.md },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.sm,
  },
  providerEmoji: { fontSize: 20 },
  providerLabel: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    gap: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.textMuted, fontSize: typography.sm },

  emailBtn: {
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emailBtnText: { color: colors.textPrimary, fontSize: typography.base, fontWeight: typography.medium },

  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.accent, fontSize: typography.sm, textAlign: 'center' },

  guestBtn: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  guestBtnText: { color: colors.textMuted, fontSize: typography.sm, textDecorationLine: 'underline' },

  terms: {
    color: colors.textMuted,
    fontSize: typography.xs,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    lineHeight: 18,
  },
  termsLink: { color: colors.primary },

  // WebView overlay
  webviewClose: {
    padding: spacing.base,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  webviewCloseText: { color: colors.error, fontSize: typography.base, fontWeight: typography.semibold },
});
