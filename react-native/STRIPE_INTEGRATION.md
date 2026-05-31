# Stripe Payment Integration Guide

## 📦 Issue #570: Stripe Payments Integration

This document describes the Stripe payment integration ported from `react-native-template` into the `react-native-strapi` prototype.

---

## 🎯 Overview

Complete Stripe Checkout payment flow implementation enabling subscription management for the Alphinium mobile app prototype.

---

## 📁 Files Added

### Services (`src/services/`)
- **`api.js`** - Axios-based API service for HTTP communication
- **`stripe.js`** - Stripe service for payment operations
  - Fetch subscription plans
  - Create checkout sessions
  - Verify payments
  - Manage subscription status
  - Cancel/reactivate subscriptions

### Components (`src/components/`)
- **`SubscriptionCard.js`** - Subscription plan display card
  - Shows plan details, pricing, features
  - Handles plan selection
  - Loading states during checkout
  - Recommended badge for featured plans

- **`LoadingOverlay.js`** - Full-screen loading indicator
  - Displays during async operations
  - Configurable loading message
  - Semi-transparent overlay

- **`ErrorAlert.js`** - Error modal dialog
  - Shows error messages
  - Retry functionality
  - Close/dismiss actions

### Screens (`src/screens/`)
- **`SubscriptionScreen.js`** - Main subscription selection screen
  - Lists all available plans
  - Handles plan selection
  - Opens Stripe Checkout via deep link
  - Error handling and retries

- **`PaymentSuccessScreen.js`** - Payment success handler
  - Verifies payment with backend
  - Shows success confirmation
  - Redirects to app on completion

- **`PaymentCancelScreen.js`** - Payment cancellation handler
  - Handles canceled payments
  - Retry or return to app options

### Hooks (`src/hooks/`)
- **`usePaymentDeepLink.js`** - Deep link handler for payment redirects
  - Listens for payment success/cancel deep links
  - Parses session IDs from URLs
  - Manages deep link state

### Utilities (`src/utils/`)
- **`subscriptionConstants.js`** - Constants and configuration
  - Mock subscription plans for testing
  - Stripe test card numbers
  - Deep link schemes
  - Error messages
  - API timeouts

### Configuration
- **`package.json`** - Added `@stripe/stripe-react-native` dependency
- **`.env.example`** - Environment configuration template
- **`app.json`** - Updated with deep link scheme and bundle identifiers

---

## 🔄 Payment Flow

### 1. User Selects Plan
```
SubscriptionScreen → User taps "Select Plan" → createCheckoutSession()
```

### 2. Checkout Session Creation
```
Mobile App → API: POST /subscriptions/create-checkout-session
            ← Returns: { id, url, status }
```

### 3. Redirect to Stripe
```
App opens Stripe Checkout URL in browser
User completes payment on Stripe's hosted page
```

### 4. Payment Redirect
```
Success: stripe.com → alphinium://payment-success?session_id=cs_xxx
Cancel:  stripe.com → alphinium://payment-cancel
```

### 5. Deep Link Handling
```
usePaymentDeepLink hook captures URL
→ Success: Shows PaymentSuccessScreen
→ Cancel:  Shows PaymentCancelScreen
```

### 6. Payment Verification
```
PaymentSuccessScreen → API: POST /subscriptions/verify-payment
                     ← Returns: { success, subscriptionId }
```

---

## 🛠️ Backend API Requirements

The mobile app expects these Strapi API endpoints (already available in `strapi-cms`):

### GET `/api/subscriptions/plans`
Returns available subscription plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic",
      "description": "Perfect for individuals",
      "price": 999,
      "currency": "usd",
      "interval": "month",
      "features": ["Feature 1", "Feature 2"],
      "stripePriceId": "price_xxx",
      "recommended": false
    }
  ]
}
```

### POST `/api/subscriptions/create-checkout-session`
Creates a Stripe Checkout session.

**Request:**
```json
{
  "planId": "basic",
  "successUrl": "alphinium://payment-success",
  "cancelUrl": "alphinium://payment-cancel"
}
```

**Response:**
```json
{
  "id": "cs_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_xxx",
  "status": "open"
}
```

### POST `/api/subscriptions/verify-payment`
Verifies payment after checkout completion.

**Request:**
```json
{
  "sessionId": "cs_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_xxx"
}
```

### GET `/api/subscriptions/status`
Gets current user's subscription status.

### POST `/api/subscriptions/cancel`
Cancels subscription at period end.

### POST `/api/subscriptions/reactivate`
Reactivates a canceled subscription.

---

## 🔐 Environment Setup

### 1. Get Stripe API Keys
1. Create a Stripe account at https://stripe.com
2. Get your publishable key from the Stripe Dashboard
3. For testing, use test mode keys (starts with `pk_test_`)

### 2. Configure Environment
Create `.env` file (copy from `.env.example`):
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Install Dependencies
```bash
npm install
```

This will install:
- `@stripe/stripe-react-native` - Stripe SDK for React Native
- `axios` - HTTP client (already included)
- Other existing dependencies

---

## 🧪 Testing

### Test Cards (Stripe Test Mode)

| Card Number | Scenario |
|------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |
| 4000 0025 0000 3155 | Requires authentication |

**Use any:**
- Future expiration date
- Any 3-digit CVC
- Any postal code

### Testing Workflow

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Navigate to Subscription Screen**
   - Select a plan
   - App opens Stripe Checkout in browser

3. **Complete Payment**
   - Use test card: 4242 4242 4242 4242
   - Enter any future date and CVC
   - Submit payment

4. **Verify Redirect**
   - App should deep link back
   - Payment verification should occur
   - Success screen should display

5. **Test Cancellation**
   - Select a plan
   - Click "Back" or "Cancel" in Stripe Checkout
   - Cancel screen should display

---

## 📱 Usage in App

### Basic Integration

```javascript
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { PaymentSuccessScreen } from './src/screens/PaymentSuccessScreen';
import { PaymentCancelScreen } from './src/screens/PaymentCancelScreen';
import { usePaymentDeepLink } from './src/hooks/usePaymentDeepLink';

function App() {
  const { deepLink, clearDeepLink } = usePaymentDeepLink();

  if (deepLink.type === 'success') {
    return (
      <PaymentSuccessScreen
        sessionId={deepLink.sessionId}
        onComplete={() => {
          clearDeepLink();
          // Navigate to main app
        }}
      />
    );
  }

  if (deepLink.type === 'cancel') {
    return (
      <PaymentCancelScreen
        onRetry={() => {
          clearDeepLink();
          // Show subscription screen again
        }}
        onClose={() => {
          clearDeepLink();
          // Return to main app
        }}
      />
    );
  }

  return <SubscriptionScreen />;
}
```

### With Navigation

If using React Navigation:

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function App() {
  const { deepLink, clearDeepLink } = usePaymentDeepLink();

  useEffect(() => {
    if (deepLink.type === 'success') {
      navigation.navigate('PaymentSuccess', { sessionId: deepLink.sessionId });
      clearDeepLink();
    } else if (deepLink.type === 'cancel') {
      navigation.navigate('PaymentCancel');
      clearDeepLink();
    }
  }, [deepLink]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="PaymentCancel" component={PaymentCancelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🎨 UI Features

### ✅ Implemented
- [x] Subscription plan cards with pricing
- [x] Feature lists for each plan
- [x] Recommended plan badge
- [x] Loading states during checkout
- [x] Error handling with retry
- [x] Success confirmation screen
- [x] Cancel/retry flow
- [x] Loading overlays
- [x] Deep link handling

### Visual Elements
- Clean, modern card-based design
- Color-coded plan indicators
- Checkmark feature lists
- Secure payment badge
- Responsive layouts
- Touch feedback on buttons

---

## 🔒 Security Considerations

1. **API Keys**: Never commit actual Stripe keys to git
2. **HTTPS**: Backend must use HTTPS in production
3. **Validation**: Always verify payments server-side
4. **Session IDs**: Don't trust client-provided session IDs without verification
5. **Deep Links**: Validate deep link URLs before processing

---

## 🚀 Deployment Checklist

- [ ] Replace test Stripe keys with production keys
- [ ] Configure production API URL
- [ ] Set up Stripe webhooks for subscription events
- [ ] Test deep linking on physical devices
- [ ] Configure app store deep link associations
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test payment flow end-to-end
- [ ] Verify subscription status updates
- [ ] Test cancellation flow
- [ ] Document support procedures

---

## 🐛 Troubleshooting

### Deep Link Not Working
- Check app.json scheme configuration (`"scheme": "alphinium"`)
- Verify URL format in backend redirect
- Test with `npx uri-scheme open alphinium://payment-success --ios`
- Ensure deep link handler is active before payment starts

### Payment Not Verifying
- Check API endpoint connectivity
- Verify session ID is being passed correctly
- Check backend Stripe webhook configuration
- Review API error logs

### Checkout Page Not Opening
- Verify Stripe checkout URL format
- Check Linking permissions
- Test `Linking.canOpenURL()` result
- Review console errors

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `npm start -c`
- Check that `@stripe/stripe-react-native` is in package.json

---

## 📊 Next Steps

### Recommended Enhancements
- [ ] Add navigation stack integration
- [ ] Implement subscription management screen
- [ ] Add payment history view
- [ ] Integrate with existing Strapi authentication
- [ ] Add promo code support
- [ ] Implement free trial handling
- [ ] Add analytics tracking
- [ ] Set up push notifications for billing events

---

## 📚 Related Documentation

- **Strapi Backend Setup:** `PROJECTS/SUPPORTING/strapi-cms/README.md`
- **Original Template:** `PROJECTS/SUPPORTING/react-native-template/mobile/STRIPE_INTEGRATION.md`
- **Stripe Checkout Docs:** https://stripe.com/docs/payments/checkout
- **React Native Linking:** https://reactnative.dev/docs/linking
- **Expo Deep Linking:** https://docs.expo.dev/guides/linking/

---

## 📝 Testing Notes

### Manual Testing Checklist
1. ✅ Subscription plans load correctly
2. ✅ Selecting a plan opens Stripe Checkout
3. ✅ Successful payment redirects to success screen
4. ✅ Payment verification completes
5. ✅ Canceled payment redirects to cancel screen
6. ✅ Retry from cancel screen works
7. ✅ Error handling shows appropriate messages
8. ✅ Loading states appear during operations

### Known Limitations
- Deep links only work on physical devices or simulators (not in web browser)
- Stripe test mode required for development
- Backend Strapi API must be running and accessible

---

**Created:** January 10, 2026  
**Issue:** #570  
**Related:** #489 (EPIC: Alphinium.com Self-Rebuild), #94 (React Native Prototype)  
**Ported from:** `react-native-template` (Issue #499)
