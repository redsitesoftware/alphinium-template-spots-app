# Installation & Setup Guide

Quick setup guide for the React Native Strapi prototype.

## 📦 Prerequisites

- **Node.js** 20.x or later
- **npm** or **yarn**
- **Expo CLI** (installed automatically)
- **iOS Simulator** (Mac only) or **Android Emulator**

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd PROJECTS/SUPPORTING/alphinium-assets/prototypes/react-native-strapi
npm install
```

**Dependencies installed:**
- `expo` - React Native framework
- `react` & `react-native` - Core framework
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Offline storage

### 2. Choose Your Version

**Option A: Enhanced Version (Recommended)**
```bash
# Backup original
cp App.js App-Basic.js

# Use enhanced version
cp App-Enhanced.js App.js
```

**Option B: Basic Version**
```bash
# Use App.js as-is (no changes needed)
```

### 3. Configure Strapi Connection

Edit the chosen `App.js`:

```javascript
// Update these constants
const STRAPI_URL = 'http://localhost:1337'; // or your Strapi URL
const STRAPI_API_TOKEN = 'your-api-token-here'; // from Strapi admin
```

**For mobile testing:**
Replace `localhost` with your computer's local IP:
```javascript
const STRAPI_URL = 'http://192.168.1.100:1337';
```

**Find your local IP:**
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

## 🗄️ Strapi Backend Setup

### Quick Strapi Installation

```bash
# In a separate directory
cd ~/projects
npx create-strapi-app@latest my-strapi --quickstart

# Start Strapi
cd my-strapi
npm run develop
```

This opens Strapi admin at: `http://localhost:1337/admin`

### Create Article Content Type

1. Go to **Content-Type Builder** (left sidebar)
2. Click **"Create new collection type"**
3. Name: `article`
4. Add fields:
   - **title** - Text (Short text)
   - **content** - Text (Long text)
5. Click **"Save"** (server restarts)

### Set Permissions

1. Go to **Settings** → **Users & Permissions** → **Roles**
2. Click **"Public"** role
3. Under **Article** permissions, check:
   - ✅ `find`
   - ✅ `findOne`
   - ✅ `create`
   - ✅ `update`
   - ✅ `delete`
4. Click **"Save"**

### Generate API Token

1. Go to **Settings** → **API Tokens**
2. Click **"Create new API Token"**
3. Fill out:
   - Name: `React Native App`
   - Token duration: `Unlimited`
   - Token type: `Full access`
4. Click **"Save"**
5. **Copy the token** (you won't see it again!)

### Update App Configuration

Paste your token into `App.js`:
```javascript
const STRAPI_API_TOKEN = 'your-copied-token-here';
```

## ▶️ Run the App

### Web (Fastest)
```bash
npm run web
```
Opens in browser at: `http://localhost:19006`

### iOS Simulator (Mac only)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Development Server (All platforms)
```bash
npm start
```
Then press:
- `w` - Open web
- `i` - Open iOS simulator
- `a` - Open Android emulator

## ✅ Verify Installation

### Test Connection
1. Start the app
2. Click **"Test Connection"** button
3. Should see: "Connected ✓"

### Test Basic CRUD
1. Click **"Fetch Articles"**
2. Create a test article:
   - Title: "Test Article"
   - Content: "This is a test"
   - Click **"Create Article"**
3. Verify article appears in list

### Test Enhanced Features (Enhanced version only)
1. Pull down to refresh
2. Search for article
3. Tap star to bookmark
4. Tap share icon
5. Tap edit icon
6. Test offline mode (turn off network)

## 🐛 Troubleshooting

### "Connection failed ✗"

**Cause:** Can't reach Strapi backend

**Solutions:**
1. Verify Strapi is running: `npm run develop`
2. Check URL is correct
3. On mobile, use local IP instead of localhost
4. Check firewall settings

### "403 Forbidden"

**Cause:** API token or permissions issue

**Solutions:**
1. Verify API token is correct
2. Check permissions in Strapi admin
3. Ensure "Public" role has Article permissions
4. Try regenerating API token

### "Cannot find module '@react-native-async-storage/async-storage'"

**Cause:** Missing dependency (Enhanced version only)

**Solution:**
```bash
npm install @react-native-async-storage/async-storage
```

### App crashes on launch

**Solutions:**
1. Clear cache: `expo start -c`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Clear watchman: `watchman watch-del-all`
4. Reset Metro bundler: `npx react-native start --reset-cache`

### Expo development server won't start

**Solutions:**
1. Check port 19000 is free
2. Kill existing Metro bundler: `pkill -f "expo start"`
3. Try different port: `expo start --port 19001`

### iOS Simulator not opening

**Solutions:**
1. Open Xcode and install simulators
2. Check Xcode command line tools: `xcode-select --install`
3. Manually open simulator: `open -a Simulator`

### Android Emulator not opening

**Solutions:**
1. Check Android Studio is installed
2. Verify ANDROID_HOME environment variable
3. Start emulator from Android Studio first
4. Check adb is running: `adb devices`

### CORS errors (Web only)

**Cause:** Browser blocking requests

**Solutions:**
1. Strapi allows CORS by default in development
2. Check `config/middlewares.js` in Strapi
3. Add your app URL to allowed origins
4. Use native mobile instead of web

## 📱 Platform-Specific Notes

### iOS
- Requires Mac with Xcode
- First launch may take 2-3 minutes
- Simulator uses computer's network
- Haptic feedback works

### Android
- Works on Mac, Windows, Linux
- Requires Android Studio & SDK
- Emulator uses computer's network
- Haptic feedback works

### Web
- Works everywhere
- No installation needed
- Some features limited (haptic, share)
- Use for quick testing

## 🔧 Advanced Configuration

### Environment Variables

Create `.env` file:
```env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token-here
```

Update `App.js`:
```javascript
import Constants from 'expo-constants';

const STRAPI_URL = Constants.expoConfig.extra.strapiUrl;
const STRAPI_API_TOKEN = Constants.expoConfig.extra.strapiToken;
```

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "strapiUrl": "http://localhost:1337",
      "strapiToken": "your-token"
    }
  }
}
```

### TypeScript Support

```bash
# Add TypeScript
npm install --save-dev typescript @types/react @types/react-native

# Rename App.js to App.tsx
mv App.js App.tsx

# Start app (auto-generates tsconfig.json)
npm start
```

### ESLint & Prettier

```bash
# Install tools
npm install --save-dev eslint prettier eslint-config-prettier

# Create .eslintrc.js
echo 'module.exports = { extends: "expo" };' > .eslintrc.js

# Create .prettierrc
echo '{ "semi": true, "singleQuote": true }' > .prettierrc

# Lint
npx eslint .

# Format
npx prettier --write .
```

## 📚 Next Steps

1. **Read Documentation:**
   - `FEATURES.md` - Feature details
   - `TESTING.md` - Testing procedures
   - `STRAPI-SETUP.md` - Detailed Strapi guide

2. **Explore Code:**
   - `App.js` - Basic version
   - `App-Enhanced.js` - Full features

3. **Test Features:**
   - Follow TESTING.md checklist
   - Try all CRUD operations
   - Test offline mode
   - Test on multiple platforms

4. **Customize:**
   - Add new features
   - Modify styling
   - Extend Strapi model
   - Add authentication

## 🎓 Learning Resources

### React Native
- [Official Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

### Strapi
- [Strapi Docs](https://docs.strapi.io/)
- [REST API Guide](https://docs.strapi.io/dev-docs/api/rest)

### Best Practices
- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [Expo Best Practices](https://docs.expo.dev/guides/best-practices/)

## 💡 Tips

1. **Development:**
   - Use web for fastest iteration
   - Test on mobile for haptic feedback
   - Use Redux DevTools for debugging

2. **Debugging:**
   - Shake device to open debug menu
   - Use Chrome DevTools for web
   - Check Metro bundler logs

3. **Performance:**
   - Use production builds for testing
   - Enable Hermes engine
   - Profile with React DevTools

4. **Deployment:**
   - Use EAS Build for app stores
   - Configure app signing
   - Test on real devices

---

**Ready to build!** 🚀

For issues or questions, see:
- README.md
- TROUBLESHOOTING section above
- GitHub Issues: redsitesoftware/alphinium
