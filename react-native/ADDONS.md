# alphinium-app Addons

Addons extend alphinium-app with optional functionality. Each addon is an npm package installed from GitHub.

---

## Available Addons

| Addon | Package | Description | Status |
|-------|---------|-------------|--------|
| **ai** | `@alphinium/ai` | AI chat widget — Dolphin/Ollama powered, no API keys needed | ✅ Ready |
| **ads** | `@alphinium/ads` | AdMob banner, interstitial & rewarded ads | ✅ Ready |
| **analytics** | `@alphinium/analytics` | Privacy-safe event tracking, self-hosted dashboard, agent-queryable | ✅ Ready |
| **socials** | `@alphinium/socials` | Social sharing (share buttons, copy link) | 🚧 In progress |
| **auth** | `@alphinium/auth` | Authentication (social login, email/pass) | ✅ Ready |
| **payments** | `@alphinium/payments` | Stripe subscription billing | ✅ Ready |

---

## @alphinium/ads — AdMob

### Install

```bash
npm install github:redsitesoftware/alphinium-ads
npm install react-native-google-mobile-ads  # real SDK — only needed for AdMob mode
```

### Enable the Expo plugin in `app.json`

Add your AdMob App IDs to the `plugins` array in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["@alphinium/ads", {
        "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
        "iosAppId":     "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
      }]
    ]
  }
}
```

> **Where do I get these IDs?**  
> Log into [admob.google.com](https://admob.google.com) → Apps → your app → App Settings → App ID.  
> Create separate apps for iOS and Android — you'll get two different App IDs.

### Configure in App.js

```js
import AdManager from '@alphinium/ads';

AdManager.configure({
  mode: 'admob',        // 'mock' | 'admob' | 'disabled'
  testMode: __DEV__,    // true = Google test IDs (safe for dev/testing)
  adUnitIds: {
    banner: {
      ios:     process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
    },
    interstitial: {
      ios:     process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID,
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID,
    },
    rewarded: {
      ios:     process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID,
      android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID,
    },
  },
});
```

Set the corresponding `EXPO_PUBLIC_ADMOB_*` env vars in your deployment config or `.env`.

### Quick start (mock mode — no account needed)

```js
AdManager.configure({ mode: 'mock' });
```

Shows the "Built with Alphinium" branded ad. Zero config.

### pods.yml env vars

See `.alphinium/pods.yml` for the full list of AdMob env var definitions (`ADMOB_*`).

### Full documentation

See [@alphinium/ads README](https://github.com/redsitesoftware/alphinium-ads#readme).

---

## @alphinium/analytics — Privacy-safe Analytics

Self-hosted, no cookies, agent-queryable. Replace Google Analytics with one that respects your users and works with your AI agents.

**Features:** pageviews, unique visitors, bounce rate, top pages, traffic sources, real-time active visitors, custom events, mobile RN SDK — all on one screen.

### Install (React Native / mobile)

```bash
npm install github:redsitesoftware/alphinium-analytics
```

### Quick start

**App.js:**
```jsx
import { AnalyticsProvider } from '@alphinium/analytics/rn';

export default function App() {
  return (
    <AnalyticsProvider
      siteId={process.env.EXPO_PUBLIC_ANALYTICS_SITE_ID}
      endpoint={process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT || 'https://analytics.alphinium.com'}
    >
      <YourApp />
    </AnalyticsProvider>
  );
}
```

**In any screen:**
```jsx
import { useAnalytics } from '@alphinium/analytics/rn';

function HomeScreen() {
  const { screen, track } = useAnalytics();

  useEffect(() => { screen('Home'); }, []);

  const onSignup = () => {
    track('signup', { plan: 'pro' });
    // ...
  };
}
```

### Web (browser snippet)

Add to your web `index.html`:
```html
<script defer
  data-site="YOUR_SITE_ID"
  src="https://analytics.alphinium.com/sdk.js">
</script>
```

### Deploy your own collector

The analytics collector is a single Docker container with SQLite storage. Deploy via user-pods:

```bash
# From your alphinium-app project root:
alphinium pod deploy analytics
```

Or run locally:
```bash
docker run -p 3050:3050 \
  -v $(pwd)/data:/data \
  -e VISITOR_SALT=your-secret-salt \
  ghcr.io/redsitesoftware/alphinium-analytics:latest
```

### env vars

Set in `.env` or `.alphinium/pods.yml`:
```
EXPO_PUBLIC_ANALYTICS_SITE_ID=your-site-id
EXPO_PUBLIC_ANALYTICS_ENDPOINT=https://analytics.yourapp.com
```

See `.alphinium/pods.yml` for all analytics env var definitions (`ANALYTICS_*`).

### Full documentation

See [alphinium-analytics README](https://github.com/redsitesoftware/alphinium-analytics#readme) and the [issues tracker](https://github.com/redsitesoftware/alphinium-analytics/issues) for the full roadmap.

---

## @alphinium/ai — AI Chat Widget

Embed a ChatInstance-powered AI assistant directly in your app. Drop-in floating button + full chat modal UI. Backed by alphinium's Dolphin/Ollama cluster — **no Copilot subscription or external API keys required.**

### Install

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/redsitesoftware/alphinium-ai/main/install.sh)
```

The installer:
- Installs `@alphinium/ai` from GitHub
- Patches `App.js` with `AlphiniumAIProvider` + `ChatWidget`
- Creates `alphinium-ai-context.md` — your agent's system prompt

### Manual setup

**App.js:**
```jsx
import { AlphiniumAIProvider, ChatWidget } from '@alphinium/ai';

export default function App() {
  return (
    <AlphiniumAIProvider
      endpoint={process.env.EXPO_PUBLIC_ALPHINIUM_AI_ENDPOINT}
      apiKey={process.env.EXPO_PUBLIC_ALPHINIUM_AI_KEY}
      appId={process.env.EXPO_PUBLIC_ALPHINIUM_APP_ID}
      agentName="My App Assistant"
      autoConnect={!!process.env.EXPO_PUBLIC_ALPHINIUM_AI_KEY}
    >
      <YourNavigator />
      <ChatWidget />  {/* floating button + chat modal */}
    </AlphiniumAIProvider>
  );
}
```

**In any screen (headless):**
```jsx
import { useAgent } from '@alphinium/ai';

function MyScreen() {
  const { send, messages, status, pushContext } = useAgent();

  // Push game/app state to the AI for context-aware responses
  useEffect(() => {
    pushContext({ screen: 'GameScreen', score: 42 });
  }, [score]);

  return <AgentBubble maxMessages={2} />;  // lightweight overlay
}
```

### Components

| Component | Description |
|-----------|-------------|
| `<ChatWidget />` | Floating FAB button + full-screen chat modal |
| `<AgentBubble maxMessages={2} />` | Lightweight overlay showing last N messages |

### Hooks

| Hook | Returns |
|------|---------|
| `useAgent()` | `{ messages, send, pushContext, status, error, connect, disconnect }` |

### Env vars (pods.yml)

```yaml
EXPO_PUBLIC_ALPHINIUM_APP_ID:   # your forge project ID (from alphinium platform)
EXPO_PUBLIC_ALPHINIUM_AI_KEY:   # AI gateway API key (from alphinium platform)
EXPO_PUBLIC_ALPHINIUM_AI_ENDPOINT: # wss://api.ci-agents.chatinstance.com (default)
```

### alphinium-ai-context.md

Edit this file to give your AI agent personality and knowledge about your app. It becomes the system prompt:

```markdown
# AI Agent Context

## App Description
My app helps users manage their daily tasks with a focus on simplicity.

## Agent Personality
You are a friendly assistant named Alex. Be concise and helpful.
Refer users to the Help screen for detailed guides.

## Key Knowledge
- The app has three main screens: Tasks, Calendar, Settings
- Users can set due dates, reminders, and priorities
```

### Architecture

```
Your alphinium-app fork
  ↓ AlphiniumAIProvider (WebSocket client)
  ↓ wss://api.ci-agents.chatinstance.com/ws/forge/{APP_ID}/chat
  ↓
ci-agents-api /ws/forge/{app_id}/chat (forge gateway)
  → validates API key → loads system prompt
  ↓
Dolphin/Ollama pod (alphinium cluster)
  → streams tokens back to widget
```

See [alphinium-ai README](https://github.com/redsitesoftware/alphinium-ai#readme) for full docs.

Handles email/password and social login (Google, Apple, Facebook).

```bash
npm install github:redsitesoftware/alphinium-auth
```

See [alphinium-auth README](https://github.com/redsitesoftware/alphinium-auth#readme).

---

## @alphinium/socials — Social Sharing

Share buttons for content (news, links, products) to Twitter/X, Facebook, WhatsApp, and more.

> **Note:** This is for *sharing content* not social *login*. For login, use `@alphinium/auth`.

```bash
npm install github:redsitesoftware/alphinium-socials
```

See [alphinium-socials README](https://github.com/redsitesoftware/alphinium-socials#readme).

---

## Adding a new addon

1. Create a new repo in the `redsitesoftware` org: `alphinium-<name>`
2. Publish as an npm package (GitHub registry or direct GitHub install)
3. Add an entry to the table above
4. If the addon requires native config, add an `app.plugin.js` and document it here
5. Add any user-configurable env vars to `.alphinium/pods.yml` under `user_provided`

---

## Admin Gate — Who Can See the Add-ons Screen?

The Add-ons tab in the app is **project operator only** — it's for the alphinium platform user who owns/manages the forge project, not for end-users of the app.

### How it works

Admin access is controlled by the `EXPO_PUBLIC_ADMIN_EMAILS` env var, set in `.alphinium/pods.yml` before the build. Any user logged in whose email matches the list sees the Add-ons tab; everyone else doesn't.

```yaml
# .alphinium/pods.yml → frontend → user_provided
EXPO_PUBLIC_ADMIN_EMAILS:
  value: "you@example.com,partner@example.com"
```

The check lives in `src/utils/admin.js`:

```js
import { isProjectAdmin } from '../utils/admin';
const { user } = useAuth();
if (isProjectAdmin(user)) { /* operator-only UI */ }
```

### Why not Strapi roles?

Strapi roles in a forked alphinium-app are the roles of the **app's end-users** — completely separate from the alphinium platform operator. Using `role.name === 'Admin'` would let any end-user promoted to Strapi Admin access developer features.

### Why not alphinium platform JWT?

The mobile app doesn't hold an alphinium platform JWT (that lives in `~/.alphinium/token` on the developer's machine, used by alphinium-cli). Baking the operator's email into the build at deploy time is simpler, more secure, and requires no platform API call at runtime.
