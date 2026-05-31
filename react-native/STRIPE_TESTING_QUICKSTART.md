# Stripe Testing - Quick Start Guide

**Issue #720** | **Quick Reference** | **Estimated Time: 2-3 hours**

---

## 🚀 Quick Setup (15 min)

```bash
# 1. Navigate to prototype
cd PROJECTS/SUPPORTING/alphinium-assets/prototypes/react-native-strapi/

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env (add your Stripe test key)
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
# EXPO_PUBLIC_API_URL=http://localhost:1337

# 5. Start Strapi backend (separate terminal)
cd ../../../../alphinium-cms/
npm run develop

# 6. Start React Native app
cd ../alphinium-assets/prototypes/react-native-strapi/
npm start
```

---

## 📋 Testing Checklist

### ✅ Setup Verification (15 min)
- [ ] App launches without errors
- [ ] Navigate to subscription screen
- [ ] Subscription plans display correctly (Free/Pro/Team)
- [ ] Strapi backend connected (http://localhost:1337)
- [ ] No console errors

### ✅ Payment Success Flow (10 min)
- [ ] Select a plan (e.g., "Pro")
- [ ] Enter test card: **4242 4242 4242 4242**
- [ ] Expiry: Any future date (e.g., 12/28)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] ZIP: Any 5 digits (e.g., 12345)
- [ ] Payment processes successfully
- [ ] Redirects to success screen
- [ ] Success message displays
- [ ] Verify backend received webhook

### ✅ Payment Declined (5 min)
- [ ] Select a plan
- [ ] Enter declined card: **4000 0000 0000 9995**
- [ ] Complete payment form
- [ ] Error message displays clearly
- [ ] Can retry payment
- [ ] Returns to subscription screen

### ✅ 3D Secure Authentication (10 min)
- [ ] Select a plan
- [ ] Enter 3DS card: **4000 0025 0000 3155**
- [ ] Complete payment form
- [ ] 3D Secure challenge appears
- [ ] Complete authentication (click "Complete" or similar)
- [ ] Payment succeeds after auth
- [ ] Success screen shows

### ✅ Cancellation Flow (5 min)
- [ ] Select a plan
- [ ] Start payment process
- [ ] Click "Cancel" on payment screen
- [ ] Returns to subscription screen
- [ ] No payment created in Stripe
- [ ] No backend record created

### ✅ Error Handling (10 min)
- [ ] **Network Error:** Disconnect WiFi, attempt payment
  - Error alert displays
  - Retry option works
- [ ] **Backend Down:** Stop Strapi, try to load plans
  - Graceful error message
  - Doesn't crash app
- [ ] **Invalid API Key:** Use wrong key in .env
  - Clear error message
  - User understands issue

### ✅ Deep Linking - iOS (10 min)
- [ ] Complete payment on iOS simulator
- [ ] Success URL redirects: `alphinium://payment-success?session_id=cs_xxx`
- [ ] App opens to success screen
- [ ] Cancel payment on iOS
- [ ] Cancel URL redirects: `alphinium://payment-cancel`
- [ ] App opens to subscription screen

### ✅ Deep Linking - Android (10 min)
- [ ] Complete payment on Android emulator
- [ ] Success URL redirects to app
- [ ] App opens correctly
- [ ] Cancel payment on Android
- [ ] Cancel URL redirects to app
- [ ] Returns to subscription screen

### ✅ UI/UX Validation (15 min)
- [ ] Subscription cards look professional
- [ ] Plan features clearly listed
- [ ] Pricing prominently displayed
- [ ] Loading overlay shows during payment
- [ ] Loading overlay hides on completion
- [ ] No console errors throughout flow
- [ ] Navigation flows are smooth
- [ ] Error messages are user-friendly
- [ ] Success messages are celebratory

---

## 🎴 Test Cards Reference

| Card Number | Expected Result | Use Case |
|-------------|----------------|----------|
| **4242 4242 4242 4242** | ✅ Success | Happy path testing |
| **4000 0000 0000 9995** | ❌ Declined | Error handling |
| **4000 0025 0000 3155** | 🔐 3D Secure | Auth flow testing |
| **4000 0000 0000 0002** | ❌ Declined (card declined) | Specific error |
| **4000 0000 0000 9979** | ❌ Stolen card | Fraud detection |

**For all cards use:**
- **Expiry:** Any future date (e.g., 12/28)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

**Stripe Test Mode Docs:** https://stripe.com/docs/testing

---

## 🔗 Deep Link URL Formats

### Success URL
```
alphinium://payment-success?session_id=cs_test_xxxxx
```

### Cancel URL
```
alphinium://payment-cancel
```

### Configuration Location
Check `src/screens/SubscriptionScreen.tsx` for redirect URLs:
```typescript
const session = await stripeService.createCheckoutSession({
  priceId: plan.stripePriceId,
  successUrl: 'alphinium://payment-success',
  cancelUrl: 'alphinium://payment-cancel'
})
```

---

## 📊 Quick Test Session Notes

```
Date: _______________
Tester: _______________
Platform: □ iOS  □ Android  □ Web
Device: _______________

✅ Tests Passed: ___ / 34
❌ Tests Failed: ___ / 34

Critical Issues Found:
- 

High Priority Issues:
- 

Medium/Low Issues:
- 

UI/UX Notes:
- 

Overall Status: □ Ready  □ Needs Work  □ Blocked

Next Steps:
- 
```

---

## ❓ Troubleshooting Guide

### Deep Links Not Working?
**Problem:** App doesn't open after payment/cancel

**Solutions:**
1. Check `app.json` has `"scheme": "alphinium"`
2. Deep links only work on iOS simulator/Android emulator (not web)
3. Verify Stripe redirect URLs in `SubscriptionScreen.tsx`
4. Test URL manually: `xcrun simctl openurl booted "alphinium://payment-success"`

### Payment Not Verifying?
**Problem:** Payment succeeds but backend doesn't confirm

**Solutions:**
1. Verify Strapi is running: `curl http://localhost:1337/api/subscriptions/plans`
2. Check Strapi logs for webhook events
3. Verify Stripe webhook endpoint configured
4. Check `EXPO_PUBLIC_API_URL` in `.env`

### Subscription Plans Not Loading?
**Problem:** Empty subscription screen

**Solutions:**
1. Verify Strapi backend is running
2. Test API endpoint: `curl http://localhost:1337/api/subscriptions/plans`
3. Check console for network errors
4. Verify `EXPO_PUBLIC_API_URL` matches Strapi URL

### 3D Secure Not Appearing?
**Problem:** 3DS card doesn't trigger auth flow

**Solutions:**
1. Ensure using test card: `4000 0025 0000 3155`
2. Verify Stripe test mode enabled
3. Check Stripe dashboard for auth challenge
4. Try different 3DS test card

### App Crashes on Payment?
**Problem:** App crashes when submitting payment

**Solutions:**
1. Check console for error stack trace
2. Verify `@stripe/stripe-react-native` installed
3. Check Stripe publishable key is valid
4. Verify iOS/Android permissions configured

---

## 🎯 Success Criteria

**Before marking complete:**
- [ ] All critical flows work (success, decline, 3DS, cancel)
- [ ] Payment integration works end-to-end
- [ ] Error handling is graceful and user-friendly
- [ ] UI/UX is polished and professional
- [ ] No console errors or warnings
- [ ] Deep linking works on iOS and Android
- [ ] Backend integration confirmed (webhooks working)
- [ ] Ready for production Stripe keys

---

## 📝 Report Full Results

After completing this quick start checklist:

1. **Fill out:** `STRIPE_TEST_REPORT.md` for detailed findings
2. **Create GitHub issues** for any bugs discovered
3. **Update documentation** if gaps found
4. **Share results** with team for review

---

## 🔗 Related Documentation

- **Full Test Report:** `STRIPE_TEST_REPORT.md` (comprehensive 34 test cases)
- **Integration Guide:** `STRIPE_INTEGRATION.md` (implementation details)
- **Installation Guide:** `STRIPE_INSTALLATION.md` (setup instructions)
- **Subscription API:** See `alphinium-cms/SUBSCRIPTION-API.md`
- **Stripe Webhooks:** See `alphinium-cms/STRIPE-WEBHOOK-TESTING.md`

---

## 🚀 Next Steps After Testing

1. ✅ Complete testing checklist above
2. 📝 Document findings in full report
3. 🐛 Create issues for bugs/improvements
4. 🔑 Request production Stripe keys (if ready)
5. 🚢 Deploy to staging environment
6. 👥 User acceptance testing
7. 📦 Production release

---

**Issue:** redsitesoftware/alphinium#720  
**Created:** 2026-01-14  
**Purpose:** Streamlined testing workflow for Stripe payment integration
