# Strapi Backend for Alphinium App

This is the Strapi CMS backend for the Alphinium React Native application.

## 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

---

## 📋 Content Type Schemas

### Articles
Collection type for managing content articles.

**Fields:**
- `title` (string, required) - Article title
- `content` (richtext, required) - Article content
- `author` (relation to users) - Article author
- `published_at` (datetime) - Publication date

**API Endpoint:** `/api/articles`

### Subscriptions
Collection type for managing user subscriptions and Stripe integration.

**Fields:**
- `user` (relation) - Related user
- `stripe_customer_id` (string, required, unique) - Stripe customer ID
- `stripe_subscription_id` (string, unique) - Stripe subscription ID
- `plan_tier` (enum: free, developer, team) - Subscription tier
- `status` (enum: active, canceled, past_due) - Subscription status
- `current_period_end` (datetime) - Current billing period end date

**API Endpoint:** `/api/subscriptions`

### Users (Extended)
Extended default user model with additional fields.

**Custom Fields:**
- `stripe_customer_id` (string, unique) - Stripe customer ID
- `subscription_status` (string) - Current subscription status
- `avatar` (media) - User avatar image
- `articles` (relation) - Articles created by user

**API Endpoint:** `/api/users`

## 🔌 Integration with React Native

Create `.env` file in React Native project:
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_KEY=your-api-token
```

Example API usage:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`
  }
});

// Fetch articles
const articles = await api.get('/api/articles');
```

## 🗄️ Database Configuration

### Development (SQLite - Default)
Already configured in `.env`

### Production (PostgreSQL - Recommended)
1. Install PostgreSQL driver:
```bash
npm install pg
```

2. Update `.env`:
```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=alphinium_prod
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_SSL=true
```

## 🔐 Authentication & API Tokens

### Generate API Token
1. Login to admin panel at http://localhost:1337/admin
2. Go to Settings > API Tokens
3. Create new token with appropriate permissions
4. Use token in Authorization header: `Bearer {token}`

### Configure Permissions
1. Go to Settings > Roles
2. Select role (Public/Authenticated)
3. Configure permissions per content type
4. Save changes

---

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
