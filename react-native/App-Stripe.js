/**
 * Stripe Payment Integration Example
 * 
 * This is a simple example showing how to integrate the Stripe payment screens
 * into your React Native app. This demonstrates the complete payment flow from
 * plan selection to payment verification.
 * 
 * Related: Issue #570 - Integrate Stripe Payments
 */

import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { PaymentSuccessScreen } from './src/screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from './src/screens/PaymentCancelScreen';
import { usePaymentDeepLink } from './src/hooks/usePaymentDeepLink';

export default function AppStripeExample() {
  const [showSubscription, setShowSubscription] = useState(true);
  const { deepLink, clearDeepLink } = usePaymentDeepLink();

  // Handle payment success
  if (deepLink.type === 'success') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <PaymentSuccessScreen
          sessionId={deepLink.sessionId}
          onComplete={() => {
            clearDeepLink();
            setShowSubscription(false);
            // Navigate to your main app screen here
            console.log('Payment successful! Navigate to main app.');
          }}
        />
      </View>
    );
  }

  // Handle payment cancel
  if (deepLink.type === 'cancel') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <PaymentCancelScreen
          onRetry={() => {
            clearDeepLink();
            setShowSubscription(true);
          }}
          onClose={() => {
            clearDeepLink();
            setShowSubscription(false);
            // Navigate to your main app screen here
            console.log('Payment canceled. Return to main app.');
          }}
        />
      </View>
    );
  }

  // Show subscription selection screen
  if (showSubscription) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SubscriptionScreen />
      </View>
    );
  }

  // Default: Show your main app content
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Your main app content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
