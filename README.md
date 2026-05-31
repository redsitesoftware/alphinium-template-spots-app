[![Forge with Alphinium](https://img.shields.io/badge/🔨_Forge_with_Alphinium-Build_Your_Version-6366f1?style=for-the-badge&logo=github)](https://alphinium.com/forge?template=spots-app)

> **This is an Alphinium template.** Click the badge above to fork this project and have an AI agent build your customised version automatically.

---

# Spots 📍

**Discover & share secret locations — built on alphinium-app**

A social, map-first location discovery app. Users pin hidden beaches, lookouts, fishing holes, cafés, hikes, and secret spots — and share them with the community.

Built as a demo app showcasing [alphinium-maps](https://github.com/redsitesoftware/alphinium-maps) and the alphinium addon ecosystem.

---

## Features

- 🗺️ **Interactive map** — Leaflet dark map with coloured pins by category
- 🔍 **Search & filter** — by category (Beach, Lookout, Hike, Café, Fishing, Secret) or keyword
- 📍 **Pin a Spot** — add name, category, description, tips, coords, tags
- ❤️ **Save spots** — bookmark your favourites
- 📌 **Check-ins** — verify you've been there
- ↗️ **Share** — native share sheet for any spot
- 👤 **Auth** — via `@alphinium/auth`
- 7 demo spots preloaded across Sydney/NSW (no backend required)

## Tabs

| Tab | Screen |
|-----|--------|
| 📍 Map | Interactive Leaflet map with pins |
| 🔍 Explore | Scrollable card list with filters |
| ❤️ My Spots | Saved + your pinned spots |
| 👤 Account | Auth, settings |

---

## Quick Start

```bash
git clone git@github.com:redsitesoftware/spots-app.git
cd spots-app/react-native
npm install
cp .env.example .env
npx expo start
```

- **Web**: press `w` → opens at http://localhost:8081
- **Android**: scan QR with Expo Go
- **iOS**: scan QR with Camera app

> The map uses Leaflet via WebView — works in Expo Go with no native rebuild.

---

## Architecture

```
spots-app/
  react-native/
    src/
      screens/
        SpotsMapScreen.js    ← Leaflet WebView map + search + filter pills
        SpotsListScreen.js   ← Card list with category filter
        SpotDetailScreen.js  ← Full detail: stats, tips, coords, tags, actions
        PinSpotScreen.js     ← Form to add a new spot
        MySpotsScreen.js     ← Saved + my pinned spots
      store/
        spotsStore.js        ← Zustand store + 7 demo spots
      navigation/
        TabNavigator.js      ← Map | Explore | My Spots | Account
```

## Built on alphinium

Fork of [alphinium-app](https://github.com/redsitesoftware/alphinium-app). Addons used:
- `@alphinium/auth` — user accounts
- `alphinium-maps` (planned) — maps engine

---

*Red Site Software — alphinium demo*
