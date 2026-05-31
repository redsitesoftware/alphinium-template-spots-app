# Strapi CMS Setup Guide

Complete setup instructions for integrating Strapi CMS with the React Native prototype.

## Prerequisites

- Node.js 20.x or later
- npm or yarn package manager
- Terminal/Command line access

## Step 1: Install Strapi

### Quick Start (Recommended)

```bash
# Create Strapi project with SQLite (no database setup needed)
npx create-strapi-app@latest my-strapi --quickstart

# This will:
# - Create a new directory 'my-strapi'
# - Install all dependencies
# - Set up SQLite database
# - Start development server
# - Open admin panel in browser
```

### Manual Installation (Advanced)

```bash
# Create Strapi with specific database
npx create-strapi-app@latest my-strapi

# Follow prompts to choose:
# - Database: PostgreSQL, MySQL, SQLite, etc.
# - Install example data: No
```

## Step 2: Create Admin Account

When Strapi opens in your browser (http://localhost:1337/admin):

1. Fill out the admin registration form:
   - First name
   - Last name  
   - Email
   - Password (min 8 characters)
2. Click "Let's start"
3. You're now in the Strapi admin panel!

## Step 3: Create Article Content Type

### Via Content-Type Builder (UI)

1. **Open Content-Type Builder**
   - Click "Content-Type Builder" in left sidebar
   - Or navigate to http://localhost:1337/admin/plugins/content-type-builder

2. **Create Collection Type**
   - Click "Create new collection type"
   - Display name: `Article`
   - API ID (singular): `article`
   - API ID (plural): `articles`
   - Click "Continue"

3. **Add Title Field**
   - Click "Add another field"
   - Select "Text"
   - Name: `title`
   - Type: Short text
   - Advanced settings:
     - Required field: Yes
     - Unique field: No
   - Click "Finish"

4. **Add Content Field**
   - Click "Add another field"
   - Select "Rich text" (or "Text" for plain text)
   - Name: `content`
   - Advanced settings:
     - Required field: Yes
   - Click "Finish"

5. **Add Optional Fields** (recommended)
   - **Author** (Text, short text)
   - **Description** (Text, long text)
   - **Published Date** (Date)
   - **Featured Image** (Media, single image)

6. **Save Content Type**
   - Click "Save" button (top right)
   - Server will automatically restart
   - Wait for "Restart successful" message

## Step 4: Configure API Permissions

### Public Access (Development Only)

1. **Navigate to Roles**
   - Go to Settings (left sidebar)
   - Click "Users & Permissions Plugin"
   - Click "Roles"
   - Click on "Public" role

2. **Set Article Permissions**
   - Scroll to "Article" section
   - Check these permissions:
     - ☑ find (list all articles)
     - ☑ findOne (get single article)
     - ☑ create (create new article)
     - ☑ update (edit article)
     - ☑ delete (remove article)
   - Click "Save" (top right)

### Authenticated Access (Recommended for Production)

1. Click on "Authenticated" role instead of "Public"
2. Set the same permissions
3. Users must provide valid JWT token

## Step 5: Generate API Token

### Create Full Access Token

1. **Navigate to API Tokens**
   - Go to Settings (left sidebar)
   - Under "Global settings"
   - Click "API Tokens"

2. **Create New Token**
   - Click "Create new API Token"
   - Fill out form:
     - Name: `React Native App`
     - Description: `Token for mobile app integration`
     - Token duration: `Unlimited` (development) or `90 days` (production)
     - Token type: `Full access`

3. **Save and Copy Token**
   - Click "Save"
   - **IMPORTANT:** Copy the token immediately
   - You won't be able to see it again
   - Store it securely (see below)

### Create Custom Token (More Secure)

For production, create token with limited permissions:

1. Token type: `Custom`
2. Select specific permissions:
   - Article: find, findOne, create, update
   - Upload: upload (if using media)
3. Click "Save"
4. Copy the token

### Store Token Securely

**For Development:**
```javascript
// In App.js
const STRAPI_API_TOKEN = 'your-copied-token-here';
```

**For Production:**
```bash
# Use environment variables
# .env file
STRAPI_API_TOKEN=your-copied-token-here
STRAPI_URL=https://your-production-strapi.com
```

## Step 6: Test API Endpoints

### Using Browser (GET only)

Open in browser:
```
http://localhost:1337/api/articles
```

Should return:
```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 0,
      "total": 0
    }
  }
}
```

### Using curl (All Methods)

**Test Connection:**
```bash
curl http://localhost:1337/api
```

**List Articles:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:1337/api/articles
```

**Create Article:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Test Article","content":"Test content"}}' \
  http://localhost:1337/api/articles
```

**Get Single Article:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:1337/api/articles/1
```

**Update Article:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Updated Title"}}' \
  http://localhost:1337/api/articles/1
```

**Delete Article:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:1337/api/articles/1
```

## Step 7: Create Sample Data

### Via Strapi Admin UI

1. **Go to Content Manager**
   - Click "Content Manager" in left sidebar
   - Click "Article" under "Collection types"

2. **Create New Entry**
   - Click "Create new entry" button
   - Fill out fields:
     - Title: `Welcome to Strapi`
     - Content: `This is our first article!`
   - Click "Save" (top right)
   - Click "Publish" to make it public

3. **Create More Entries**
   - Repeat for multiple articles
   - Try different content

### Via API

```bash
# Create multiple articles
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Getting Started","content":"Learn how to use Strapi CMS"}}' \
  http://localhost:1337/api/articles

curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Advanced Features","content":"Explore advanced Strapi capabilities"}}' \
  http://localhost:1337/api/articles
```

## Step 8: Configure CORS (if needed)

### For Local Development

Strapi allows localhost by default. No changes needed.

### For Production/Custom Domain

Edit `config/middlewares.js`:

```javascript
module.exports = [
  // ... other middlewares
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',
        'http://localhost:19006', // Expo web
        'https://your-app-domain.com',
        'https://alphinium.io',
      ],
      credentials: true,
    },
  },
];
```

## Step 9: Update React Native App

### Configure API Details

Edit `App.js` in the React Native prototype:

```javascript
// At the top of App.js
const STRAPI_URL = 'http://localhost:1337';
const STRAPI_API_TOKEN = 'your-api-token-here'; // Paste your actual token
```

### For Mobile Testing

Replace localhost with your computer's IP:

```javascript
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
const STRAPI_URL = 'http://192.168.1.100:1337';
```

Ensure Strapi accepts connections:

```bash
# Start Strapi with host flag
npm run develop -- --host 0.0.0.0
```

## Step 10: Run and Test

### Start Strapi

```bash
cd my-strapi
npm run develop
```

Strapi admin: http://localhost:1337/admin

### Start React Native App

```bash
cd prototypes/react-native-strapi
npm install
npm run web
```

App: http://localhost:19006 (or check terminal for URL)

### Test Integration

1. **Test Connection**
   - Click "Test Connection" button
   - Should see "Connected ✓"

2. **Fetch Articles**
   - Click "Fetch Articles"
   - Should see articles created in Step 7

3. **Create Article**
   - Fill in title and content
   - Click "Create Article"
   - Should appear in list automatically

## Troubleshooting

### Port Already in Use

```bash
# If port 1337 is busy, change Strapi port
# Edit config/server.js
module.exports = {
  port: process.env.PORT || 1338,
};
```

### Database Locked (SQLite)

```bash
# Stop all Strapi instances
# Delete .tmp folder
rm -rf .tmp/

# Restart Strapi
npm run develop
```

### API Token Not Working

1. Regenerate token in Strapi admin
2. Ensure no extra spaces when copying
3. Verify token type has correct permissions
4. Check token expiration date

### CORS Errors

1. Check Strapi middlewares.js config
2. Ensure origin matches your app URL
3. Restart Strapi after config changes

### Cannot Create Articles

1. Verify Public role has `create` permission
2. Check API token has correct permissions
3. Ensure Content-Type header is set
4. Check request data format matches Strapi schema

## Next Steps

### Add More Features

1. **Search** - Add search functionality
2. **Filtering** - Filter articles by date, author
3. **Pagination** - Handle large article lists
4. **Categories** - Add categories/tags
5. **Media Upload** - Add image uploads
6. **User Authentication** - Implement user login

### Production Deployment

1. **Strapi:**
   - Deploy to Heroku, AWS, DigitalOcean
   - Use PostgreSQL or MySQL database
   - Configure environment variables
   - Enable SSL/HTTPS

2. **React Native App:**
   - Update STRAPI_URL to production URL
   - Use environment variables for tokens
   - Build for iOS/Android app stores
   - Deploy web version to static hosting

## Resources

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi REST API Guide](https://docs.strapi.io/dev-docs/api/rest)
- [Strapi Content-Type Builder](https://docs.strapi.io/user-docs/content-type-builder)
- [Strapi API Tokens](https://docs.strapi.io/user-docs/settings/api-tokens)

---

**Setup Guide for Alphinium Platform - Issue #324**
