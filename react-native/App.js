import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@alphinium/auth';
import { STRAPI_URL } from './src/config';
import TabNavigator from './src/navigation/TabNavigator';
import OnboardingScreen, { hasSeenOnboarding } from './src/screens/OnboardingScreen';
import { Text, View } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1a1a1a' }}>
          <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold' }}>App Error</Text>
          <Text style={{ color: '#fff', marginTop: 10, textAlign: 'center' }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// @alphinium/ai — optional: only active when EXPO_PUBLIC_ALPHINIUM_AI_KEY is set
let AlphiniumAIProvider = null;
let ChatWidget = null;
if (process.env.EXPO_PUBLIC_ALPHINIUM_AI_KEY) {
  try {
    const ai = require('@alphinium/ai');
    AlphiniumAIProvider = ai.AlphiniumAIProvider;
    ChatWidget = ai.ChatWidget;
  } catch (_) {
    // @alphinium/ai not installed — AI chat disabled
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading

  useEffect(() => {
    hasSeenOnboarding().then((done) => setShowOnboarding(!done));
  }, []);

  // Wait for AsyncStorage check before rendering
  if (showOnboarding === null) return null;

  if (showOnboarding) {
    return (
      <QueryClientProvider client={queryClient}>
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      </QueryClientProvider>
    );
  }

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider strapiUrl={STRAPI_URL}>
        <NavigationContainer>
          {AlphiniumAIProvider ? (
            <AlphiniumAIProvider
              endpoint={process.env.EXPO_PUBLIC_ALPHINIUM_AI_ENDPOINT}
              apiKey={process.env.EXPO_PUBLIC_ALPHINIUM_AI_KEY}
              appId={process.env.EXPO_PUBLIC_ALPHINIUM_APP_ID}
              autoConnect
            >
              <TabNavigator />
              <ChatWidget />
            </AlphiniumAIProvider>
          ) : (
            <TabNavigator />
          )}
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
