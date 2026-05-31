# 🚀 Quick Start - Automated Stripe Setup

**Replace 2-3 hours of manual work with 5 minutes of automation!**

---

## ⚡ The Fast Way (Recommended)

### 1. Set Your Stripe Key

```bash
# Test mode (for development)
export STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Or add to .env file
echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE" > .env
```

Get your key from: https://dashboard.stripe.com/test/apikeys

### 2. Run One Command

```bash
npm run setup:stripe:test && npm run update:config:test
```

**Done!** ✨ All 11 products with 24-26 prices are created and configured.

### 3. Test It

```bash
npm run test:server
# Open http://localhost:3456/test
```

---

## 📊 What Just Happened?

**Created in Stripe:**
- ✅ 11 products (Alphinium, ChatInstance, Enterprise, UserPods)
- ✅ 24-26 prices (monthly/beta/annual variants)
- ✅ Proper metadata for tracking

**Updated Locally:**
- ✅ `src/config/plans-alphinium.js` - Real price IDs
- ✅ `src/config/plans-chatinstance.js` - Real price IDs
- ✅ `src/config/plans-userpods.js` - Real price IDs
- ✅ `test-stripe-integration.html` - Test UI ready

**Saved:**
- ✅ `.stripe-prices-test.json` - Price ID reference

---

## 🔄 For Production (Live Mode)

After testing thoroughly in test mode:

```bash
# Switch to live key
export STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY

# Create in production Stripe
npm run setup:stripe:live && npm run update:config:live
```

---

## 🤔 Why Automation?

### Manual Setup (Old Way)
| Step | Time |
|------|------|
| Create 11 products | 30 min |
| Create 24-26 prices | 60 min |
| Copy price IDs | 20 min |
| Update 4 config files | 30 min |
| Test & fix typos | 30 min |
| **TOTAL** | **2-3 hours** |

### Automated Setup (New Way)
| Step | Time |
|------|------|
| Run setup command | 2 min |
| Run update command | 1 min |
| Verify in dashboard | 2 min |
| **TOTAL** | **5 minutes** |

---

## 🎯 What's Included

### Alphinium Products
- **Developer:** $29/mo, $20/mo (beta), $264/yr
- **Team:** $99/mo, $69/mo (beta), $888/yr

### ChatInstance Products
- **Starter:** $99/mo, $69/mo (beta), $948/yr
- **Professional:** $199/mo, $139/mo (beta), $1,908/yr
- **Business:** $299/mo, $209/mo (beta), $2,868/yr

### Enterprise Products
- **Starter:** $2,500/mo, $2,000/mo (beta), $27,000/yr
- **Growth:** $5,000/mo, $4,000/mo (beta), $54,000/yr

### UserPods Add-ons
- **Hobby:** $29/mo
- **Pro:** $49/mo
- **Business:** $79/mo

All in **AUD currency** with **recurring billing**.

---

## 📚 Learn More

- **[AUTOMATION.md](./AUTOMATION.md)** - Full automation guide
- **[TESTING.md](./TESTING.md)** - Testing workflows
- **[README.md](./README.md)** - Package documentation

---

## 🆘 Need Help?

### Common Issues

**"STRIPE_SECRET_KEY not found"**
```bash
export STRIPE_SECRET_KEY=sk_test_xxx
```

**"Price file not found"**
```bash
npm run setup:stripe:test  # Run this first
```

**"Products already exist"**
- Script is idempotent - it will reuse existing products ✅
- To start fresh: Archive old products in Stripe Dashboard

---

**Time to setup:** 5 minutes  
**Products created:** 11  
**Prices configured:** 24-26  
**Manual work saved:** ~2.5 hours  

🎉 **Start building your billing integration immediately!**
