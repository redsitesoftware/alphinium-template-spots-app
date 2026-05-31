# Brand Assets Guide

**Last Updated:** March 1, 2026 @ 1:59 PM  
**Repository:** [alphinium-marketing-assets](https://github.com/redsitesoftware/alphinium-marketing-assets)

## 🎯 Overview

All brand assets (logos, icons, splash screens) are centralized in the `alphinium-marketing-assets` repository. This provides a single source of truth for all Red Site Software properties.

## 📦 Repository Structure

```
alphinium-marketing-assets/
├── logos/
│   ├── redsitesoftware/     # Red Site Software brand
│   │   ├── RSSLogo-original.png
│   │   ├── RSSLogo-icon-1024.png
│   │   ├── RSSLogo-adaptive-icon-1024.png
│   │   ├── RSSLogo-splash-1242x2436.png
│   │   ├── RSSLogo-favicon-512.png
│   │   └── README.md
│   ├── chatinstance/        # ChatInstance brand
│   │   ├── ChatInstanceLogo-original.png
│   │   ├── ChatInstanceLogo-icon-1024.png
│   │   ├── ChatInstanceLogo-adaptive-icon-1024.png
│   │   ├── ChatInstanceLogo-splash-1242x2436.png
│   │   ├── ChatInstanceLogo-favicon-512.png
│   │   └── README.md
│   └── alphinium/           # Alphinium brand
│       ├── AlphiniumLogo-original.png
│       ├── AlphiniumLogo-icon-1024.png
│       ├── AlphiniumLogo-adaptive-icon-1024.png
│       ├── AlphiniumLogo-splash-1242x2436.png
│       ├── AlphiniumLogo-favicon-512.png
│       └── README.md
├── brand-guidelines/
│   ├── colors.json          # Brand color definitions
│   └── README.md            # Typography & usage guidelines
├── icons/                   # Additional icons (future)
├── index.html               # Beautiful preview page
└── README.md                # Main documentation
```

## 🎨 Available Brands

### Red Site Software
- **Primary Color:** #E74C3C (Red)
- **Secondary Color:** #2C3E50 (Dark Blue)
- **Logo:** Original RSS logo from redsitesoftware.com
- **Status:** Production-ready
- **Files:** 5 standardized assets

### ChatInstance
- **Primary Color:** #3498DB (Blue)
- **Secondary Color:** #2C3E50 (Dark Blue)
- **Logo:** Blue gradient speech bubble icon
- **Status:** Production-ready
- **Files:** 5 standardized assets

### Alphinium
- **Primary Color:** #9B59B6 (Purple)
- **Secondary Color:** #2C3E50 (Dark Blue)
- **Logo:** Purple "A" lettermark
- **Status:** Production-ready v1.0
- **Files:** 5 standardized assets
- **Note:** Simple lettermark, can be upgraded to more elaborate design

## 📱 Asset Types

Each brand includes 5 standardized asset files:

### 1. Original Logo
- **Purpose:** Source file for all other assets
- **Size:** 512x512 (or 256x256 for RSS)
- **Format:** PNG with transparency
- **Usage:** Reference, documentation, high-quality displays

### 2. App Icon
- **Purpose:** iOS and Android app icon
- **Size:** 1024x1024
- **Format:** PNG
- **Requirements:**
  - No alpha channel issues
  - No rounded corners (platform handles this)
  - Professional appearance
- **Usage:** App stores, home screen icon

### 3. Adaptive Icon
- **Purpose:** Android adaptive icon foreground
- **Size:** 1024x1024
- **Format:** PNG with transparency
- **Requirements:**
  - Material Design compatible
  - Safe zone for cropping
- **Usage:** Android adaptive icon system

### 4. Splash Screen
- **Purpose:** App loading screen
- **Size:** 1242x2436 (iPhone 13 Pro Max)
- **Format:** PNG
- **Contents:**
  - Centered logo (350x350)
  - Brand name
  - Tagline/description
  - Clean, professional layout
- **Usage:** App startup, first impression

### 5. Favicon
- **Purpose:** Web browser tab icon
- **Size:** 512x512
- **Format:** PNG with transparency
- **Usage:** Web applications, browser tabs

## 🚀 Usage in alphinium-app

### React Native Assets

The React Native app (`react-native/assets/`) uses assets from this repository:

```bash
# Copy assets for your brand
cd alphinium-app/react-native/assets

# For RSS branding
cp ~/alphinium-marketing-assets/logos/redsitesoftware/RSSLogo-icon-1024.png ./icon.png
cp ~/alphinium-marketing-assets/logos/redsitesoftware/RSSLogo-adaptive-icon-1024.png ./adaptive-icon.png
cp ~/alphinium-marketing-assets/logos/redsitesoftware/RSSLogo-splash-1242x2436.png ./splash.png
cp ~/alphinium-marketing-assets/logos/redsitesoftware/RSSLogo-favicon-512.png ./favicon.png

# For Alphinium branding
cp ~/alphinium-marketing-assets/logos/alphinium/AlphiniumLogo-icon-1024.png ./icon.png
cp ~/alphinium-marketing-assets/logos/alphinium/AlphiniumLogo-adaptive-icon-1024.png ./adaptive-icon.png
cp ~/alphinium-marketing-assets/logos/alphinium/AlphiniumLogo-splash-1242x2436.png ./splash.png
cp ~/alphinium-marketing-assets/logos/alphinium/AlphiniumLogo-favicon-512.png ./favicon.png
```

### App Configuration

Update `react-native/app.json`:

```json
{
  "expo": {
    "name": "Alphinium",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## 🎨 Brand Guidelines

### Colors

See `brand-guidelines/colors.json` for exact color codes:

```json
{
  "redsitesoftware": {
    "primary": "#E74C3C",
    "secondary": "#2C3E50"
  },
  "chatinstance": {
    "primary": "#3498DB",
    "secondary": "#2C3E50"
  },
  "alphinium": {
    "primary": "#9B59B6",
    "secondary": "#2C3E50"
  }
}
```

### Typography

- **Primary Font:** System default (Helvetica/Arial/San Francisco)
- **Headings:** Bold weight
- **Body:** Regular weight

### Logo Usage

- Always use high-resolution versions
- Maintain aspect ratio (no stretching)
- Minimum size: 32px height
- Clear space: 1x logo height on all sides
- Use original PNG for best quality

## 🔍 Preview

View all assets visually:

**Local:** Open `index.html` in browser  
**GitHub:** https://github.com/redsitesoftware/alphinium-marketing-assets

The preview page shows:
- All three brands in separate sections
- Each brand's color palette
- All 5 assets displayed cleanly
- Responsive grid layout
- Professional presentation

## 📋 Checklist for New Brands

When adding a new brand:

- [ ] Create directory under `logos/[brand-name]/`
- [ ] Generate 5 standardized assets:
  - [ ] Original logo (512x512)
  - [ ] App icon (1024x1024)
  - [ ] Adaptive icon (1024x1024)
  - [ ] Splash screen (1242x2436)
  - [ ] Favicon (512x512)
- [ ] Create README.md with brand details
- [ ] Add colors to `brand-guidelines/colors.json`
- [ ] Add section to preview page (`index.html`)
- [ ] Document in main README
- [ ] Commit and push to repository

## 🔗 Related Issues

- **Issue #7** - Parallel Work (Task #3: App Assets)
- **Issue #29** - ChatInstance Logo Standardization ✅ Complete
- **Issue #30** - Alphinium Logo Design ✅ Complete
- **Issue #32** - Create alphinium-marketing-assets Repository ✅ Complete

## 📚 Additional Resources

- [Expo Asset Documentation](https://docs.expo.dev/guides/assets/)
- [iOS App Icon Requirements](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [Material Design Icons](https://m3.material.io/styles/icons)

---

**Maintained by:** Red Site Software  
**Last Updated:** March 1, 2026  
**Questions?** See main README or open an issue
