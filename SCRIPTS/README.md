# Development Scripts

Common scripts for Alphinium App development.

## 🚀 Quick Start

```bash
# First time setup
./SCRIPTS/setup.sh

# Start backend only
./SCRIPTS/dev-backend.sh

# Start mobile only  
./SCRIPTS/dev-mobile.sh

# Start both (macOS - opens separate windows)
./SCRIPTS/dev-all.sh

# Alternative: Use tabs (requires Accessibility permission)
./SCRIPTS/dev-all-tabs.sh
```

## 📋 Scripts

### `setup.sh`
Initial setup - run once after cloning:
- Initializes git submodules
- Creates .env files from examples
- Installs all dependencies (backend, mobile, payments)
- Shows next steps

**Note:** After first backend start, run `./SCRIPTS/create-admin.js` to auto-create admin user.

### `create-admin.js`
Auto-creates Strapi admin user:
- Reads credentials from `backend/.env`
- Creates admin if doesn't exist
- Shows login credentials
- Run after starting backend for first time

### `dev-backend.sh`
Starts Strapi CMS backend:
- Auto-creates .env if missing
- Auto-installs dependencies if needed
- Opens at http://localhost:1337
- Admin panel at http://localhost:1337/admin

### `dev-mobile.sh`
Starts React Native mobile app:
- Auto-creates .env if missing
- Auto-installs dependencies if needed
- Opens Expo DevTools
- Press 'a' for Android, 'i' for iOS, 'w' for Web

### `dev-all.sh`
Starts both backend + mobile:
- macOS: Opens in separate Terminal windows
- Linux: Shows instructions to run in separate terminals

### `dev-all-tabs.sh`
Starts both in Terminal tabs (macOS only):
- Opens backend in new tab
- Opens mobile in new tab
- **Requires:** Accessibility permission (see below)

## 🔑 Environment Setup

After running `setup.sh`, everything is **fully automatic!**

**On first backend start:**
- ✅ Admin user auto-created
- ✅ API token auto-generated
- ✅ Token auto-written to `react-native/.env`

Just start the apps - no manual token copying needed!

## 📱 Running on Devices

### iOS Simulator
```bash
./SCRIPTS/dev-mobile.sh
# Press 'i' in Expo DevTools
```

### Android Emulator
```bash
./SCRIPTS/dev-mobile.sh
# Press 'a' in Expo DevTools
```

### Physical Device
```bash
./SCRIPTS/dev-mobile.sh
# Scan QR code with Expo Go app
```

### Web Browser
```bash
./SCRIPTS/dev-mobile.sh
# Press 'w' in Expo DevTools
```

## 🔓 macOS Accessibility Permission (for dev-all-tabs.sh)

If you want to use tabs instead of windows:

1. **System Settings** → **Privacy & Security** → **Accessibility**
2. Click the lock icon to make changes
3. Click **+** button
4. Add your terminal app (Terminal.app, iTerm, etc.)
5. Enable the checkbox
6. Restart your terminal
7. Run `./SCRIPTS/dev-all-tabs.sh`

**Or just use `dev-all.sh` which opens windows (no permission needed)!**

## 🛠️ Troubleshooting

**Port already in use:**
```bash
# Backend (1337)
lsof -ti:1337 | xargs kill -9

# Metro bundler (8081)
lsof -ti:8081 | xargs kill -9
```

**Reset everything:**
```bash
# Clean and reinstall
rm -rf backend/node_modules react-native/node_modules
./SCRIPTS/setup.sh
```

**Submodule issues:**
```bash
git submodule update --init --recursive --force
```

---

**Tip:** Run `dev-all.sh` to start everything at once on macOS!
