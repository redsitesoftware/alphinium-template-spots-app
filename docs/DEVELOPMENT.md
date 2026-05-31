# Development Workflow

**Version:** 1.1.0 | **Updated:** May 2026

---

## Daily workflow

```bash
# Pull latest
cd alphinium-app
git pull origin main

# Start frontend
cd react-native
npm install   # only if package.json changed
npm start     # press w (web), i (iOS), a (Android)

# Start backend (separate terminal, only if testing auth/Strapi)
cd ../backend
npm run develop
```

---

## Key files to know

| File | Purpose |
|------|---------|
| `react-native/App.js` | App root — QueryClientProvider → AuthProvider → NavigationContainer |
| `react-native/src/config.js` | All `EXPO_PUBLIC_*` env vars |
| `react-native/src/theme.js` | Design tokens — edit here to rebrand a forge fork |
| `react-native/src/store/index.ts` | Zustand global store (auth + UI state) |
| `react-native/src/types/index.ts` | Shared TypeScript types |
| `.alphinium/pods.yml` | Deployment manifest — canonical config for forge + user-pods |

---

## Auth

Auth is provided by `@alphinium/auth`. In any screen:

```js
import { useAuth } from '@alphinium/auth';

function MyScreen() {
  const { user, token, isAuthenticated, logout } = useAuth();
}
```

The `withAuth` HOC protects screens:

```js
import { withAuth } from '@alphinium/auth';
export default withAuth(DashboardScreen, LoginScreen);
```

---

## Global state (Zustand)

```ts
import { useAppStore, selectUser, selectIsAuthenticated } from '../store';

const user = useAppStore(selectUser);
const isAuth = useAppStore(selectIsAuthenticated);
```

To update state:

```ts
const setLoading = useAppStore(s => s.setLoading);
setLoading(true);
```

---

## Data fetching (TanStack Query)

`QueryClientProvider` is already in `App.js`. Use `useQuery`/`useMutation` for server data:

```js
import { useQuery } from '@tanstack/react-query';

const { data: plans, isLoading } = useQuery({
  queryKey: ['plans'],
  queryFn: () => fetch(`${STRAPI_URL}/api/plans`).then(r => r.json()),
  staleTime: 5 * 60 * 1000,  // 5 min
});
```

---

## Adding a new screen

1. Create `src/screens/MyScreen.js`
2. Add to the appropriate navigator in `src/navigation/`
3. Use `useAuth()` if the screen needs the current user
4. Use `useQuery()` for any server data

---

## TypeScript

New files can be `.ts` or `.tsx` — they'll be type-checked automatically. Existing `.js` files are unaffected. Types live in `src/types/index.ts`:

```ts
import type { StrapiUser, Subscription } from '../types';
```

---

## Adding an addon

Addons are installed via `alphinium-forge-cli` using `install.sh` scripts from the [alphinium-assets registry](https://github.com/redsitesoftware/alphinium-assets). To manually install an addon during development:

```bash
# Example: install alphinium-ads
curl -s https://raw.githubusercontent.com/redsitesoftware/alphinium-ads/main/install.sh | bash
```

---

## Linting / checks

```bash
cd react-native
npx tsc --noEmit   # TypeScript type check (won't fail on .js files)
```

---

## Payments (local dev)

The app talks to `alphinium-payments` (`https://payments-api.alphinium.com`). For local payments testing, set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env` and use Stripe test card `4242 4242 4242 4242`.

The entitlement check (`GET /api/entitlement/:userId`) tells the app the user's current subscription tier.

---

## Git workflow

```bash
# Feature work
git checkout -b feature/my-feature
# ... work ...
git push origin feature/my-feature
# Open PR → squash merge to main
```

⚠️ **Never push directly to `main`** if CI/CD is configured — PRs protect the live deployment.

---

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [SETUP.md](./SETUP.md) — First-time setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deploy to user-pods
