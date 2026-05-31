# Stripe Integration - Quick Installation Guide

## 📦 Prerequisites

- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Strapi backend running (see `STRAPI-SETUP.md`)
- Stripe account (test mode is fine for development)

---

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd prototypes/react-native-strapi
npm install
```

This installs:
- `@stripe/stripe-react-native` (Stripe SDK)
- `axios` (HTTP client)
- All other dependencies

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your keys
nano .env
```

Add your configuration:
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Get your Stripe test key:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the "Publishable key" (starts with `pk_test_`)
3. Paste it into `.env`

### 3. Start the App
```bash
npm start
```

Choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app

### 4. Test the Payment Flow

**Option A: Use the Stripe example app**
```bash
# Rename App.js temporarily
mv App.js App-Original.js
mv App-Stripe.js App.js

# Start the app
npm start
```

**Option B: Import components manually**
```javascript
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { usePaymentDeepLink } from './src/hooks/usePaymentDeepLink';
```

### 5. Test with Stripe Test Cards

When the checkout page opens, use these test cards:

| Card Number | Result |
|------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 9995 | ❌ Declined |

**Any other details:**
- Expiration: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## 📁 What Was Added

### New Files
```
src/
├── components/
│   ├── SubscriptionCard.js      # Subscription plan card
│   ├── LoadingOverlay.js        # Loading indicator
│   └── ErrorAlert.js            # Error modal
├── screens/
│   ├── SubscriptionScreen.js    # Main subscription screen
│   ├── PaymentSuccessScreen.js  # Success handler
│   └── PaymentCancelScreen.js   # Cancel handler
├── services/
│   ├── api.js                   # HTTP client
│   └── stripe.js                # Stripe service
├── hooks/
│   └── usePaymentDeepLink.js    # Deep link handler
└── utils/
    └── subscriptionConstants.js # Constants & config

.env.example                      # Environment template
App-Stripe.js                     # Example integration
STRIPE_INTEGRATION.md             # Full documentation
```

### Modified Files
- `package.json` - Added `@stripe/stripe-react-native` dependency
- `app.json` - Added deep link scheme and bundle identifiers
- `README.md` - Added Stripe integration section

---

## 🔧 Configuration Details

### Deep Links (Already Configured)
The app uses the scheme `alphinium://` for payment redirects:
- Success: `alphinium://payment-success?session_id=cs_xxx`
- Cancel: `alphinium://payment-cancel`

This is configured in `app.json`:
```json
{
  "expo": {
    "scheme": "alphinium",
    "ios": {
      "bundleIdentifier": "com.alphinium.strapiprototype"
    },
    "android": {
      "package": "com.alphinium.strapiprototype"
    }
  }
}
```

### Testing Deep Links
```bash
# iOS
npx uri-scheme open alphinium://payment-success?session_id=cs_test_123 --ios

# Android
npx uri-scheme open alphinium://payment-success?session_id=cs_test_123 --android
```

---

## 🐛 Troubleshooting

### "Module not found: @stripe/stripe-react-native"
```bash
npm install
npm start -c  # Clear cache
```

### "Cannot connect to API"
- Ensure Strapi backend is running on port 1337
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Verify network connectivity

### Deep links not working
- Deep links only work on physical devices or simulators
- They don't work in web browser
- Test on iOS simulator or Android emulator

### "Failed to load subscription plans"
- Check that Strapi backend has subscription endpoints
- See `PROJECTS/SUPPORTING/strapi-cms/` for backend setup
- Verify API URL is correct in `.env`

---

## 📊 Next Steps

1. **Backend Setup**
   - Set up Stripe webhooks in Strapi
   - Configure subscription products in Stripe Dashboard
   - Test webhook delivery

2. **Integration**
   - Add navigation to subscription screen
   - Integrate with your existing app flow
   - Add authentication check before showing plans

3. **Customization**
   - Update subscription plans in `src/utils/subscriptionConstants.js`
   - Customize UI colors and styling
   - Add your branding

4. **Testing**
   - Test all payment scenarios
   - Test deep links on physical devices
   - Verify webhook handling

5. **Production**
   - Replace test keys with production keys
   - Set up production webhooks
   - Configure production URLs

---

## 📚 Full Documentation

For complete details, see:
- **[STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md)** - Complete integration guide
- **[Strapi Setup](../../strapi-cms/README.md)** - Backend configuration
- **[Original Template](../../react-native-template/mobile/STRIPE_INTEGRATION.md)** - Template documentation

---

## 🆘 Need Help?

**Common Issues:**
1. Check `.env` file exists and has correct keys
2. Ensure Strapi backend is running
3. Clear cache: `npm start -c`
4. Reinstall dependencies: `rm -rf node_modules && npm install`

**Documentation:**
- Stripe Docs: https://stripe.com/docs
- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev

---

**Issue:** #570  
**Created:** January 10, 2026  
**Ported from:** react-native-template
