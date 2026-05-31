# Valerie Screenshot Guide

Guide for using Valerie (Visual Audio Loop - Environment Remote Interaction Engine) to capture screenshots of the React Native + Strapi prototype.

## What is Valerie?

Valerie is Alphinium's browser automation tool for capturing screenshots of web applications running in the development environment.

## Prerequisites

- React Native app running on web (npm run web)
- Strapi CMS running (optional - app has demo mode)
- Valerie tool available in Alphinium platform

## Step 1: Prepare the Application

### Start Services

```bash
# Terminal 1: Start Strapi (if testing full integration)
cd my-strapi
npm run develop

# Terminal 2: Start React Native prototype
cd PROJECTS/SUPPORTING/alphinium-assets/prototypes/react-native-strapi
npm install
npm run web
```

### Create Sample Data

Create some test articles in Strapi admin panel to make screenshots more interesting:

1. Open http://localhost:1337/admin
2. Go to Content Manager → Article
3. Create 3-5 sample articles with titles and content
4. Click "Publish" on each

### Set App to Good State

1. Open http://localhost:19006 (or the URL shown in terminal)
2. Click "Test Connection" - verify connected
3. Click "Fetch Articles" - load sample data
4. Scroll to show key features
5. Maybe create a new article via the form

## Step 2: Access App URL

### Find the URL

```bash
# Look for output like:
# Expo DevTools is running at http://localhost:19006
# Web server running at http://localhost:19006
```

The web app URL will typically be:
- Local: http://localhost:19006
- Network: http://192.168.x.x:19006

### Make Accessible to Valerie

If Valerie runs in a different container/environment:

```bash
# Use machine's network IP instead of localhost
# On Mac: ipconfig getifaddr en0
# On Linux: hostname -I
```

## Step 3: Use Valerie Screenshot Tool

### Via Alphinium Platform

```bash
# From Alphinium platform, use Valerie command:
valerie screenshot http://localhost:19006 \
  --output prototypes/screenshots/issue-324-strapi-integration.png \
  --wait 2000 \
  --viewport 1280x800
```

### Screenshot Options

```bash
# Full page screenshot
valerie screenshot [URL] \
  --output [filename] \
  --fullpage

# Specific viewport size
valerie screenshot [URL] \
  --viewport 1920x1080 \
  --output [filename]

# Wait for content to load
valerie screenshot [URL] \
  --wait 3000 \
  --output [filename]

# Capture with scroll
valerie screenshot [URL] \
  --scroll-to-bottom \
  --output [filename]
```

## Step 4: Capture Multiple Screenshots

### Main View (Connected State)

```bash
valerie screenshot http://localhost:19006 \
  --output screenshots/strapi-main-view.png \
  --wait 2000 \
  --viewport 1280x800
```

**What to show:**
- Header with title
- Connection status badge showing "Connected ✓"
- Connection test button
- Articles section with loaded data

### Articles List View

Scroll to articles section, then:

```bash
valerie screenshot http://localhost:19006 \
  --output screenshots/strapi-articles-list.png \
  --wait 2000 \
  --viewport 1280x800 \
  --scroll 500
```

**What to show:**
- Multiple articles displayed
- Article cards with titles, content, dates
- Clean layout

### Create Article Form

Scroll to create section with form filled in:

```bash
valerie screenshot http://localhost:19006 \
  --output screenshots/strapi-create-form.png \
  --wait 2000 \
  --viewport 1280x800 \
  --scroll 1000
```

**What to show:**
- Input fields with sample text
- "Create Article" button
- Form validation states

### Mobile View

```bash
valerie screenshot http://localhost:19006 \
  --output screenshots/strapi-mobile-view.png \
  --wait 2000 \
  --viewport 375x667 \
  --device iPhone
```

**What to show:**
- Responsive layout on mobile
- Touch-friendly buttons
- Readable text sizes

### Admin Panel Integration

Capture Strapi admin showing the content:

```bash
valerie screenshot http://localhost:1337/admin \
  --output screenshots/strapi-admin-panel.png \
  --wait 3000 \
  --viewport 1920x1080
```

**What to show:**
- Strapi admin interface
- Content Manager with articles
- Content-Type Builder showing Article type

## Step 5: Organize Screenshots

### Directory Structure

```
prototypes/screenshots/
├── issue-324-strapi-integration.png       # Main screenshot
├── issue-324-strapi-articles-list.png     # Articles view
├── issue-324-strapi-create-form.png       # Create form
├── issue-324-strapi-mobile.png            # Mobile view
├── issue-324-strapi-admin.png             # Strapi admin
└── issue-324-strapi-connection-test.png   # Connection test
```

### Naming Convention

Use format: `issue-[number]-[feature]-[view].png`

Examples:
- `issue-324-strapi-integration.png`
- `issue-324-strapi-articles-list.png`
- `issue-324-strapi-admin-panel.png`

## Step 6: Commit Screenshots

```bash
# Navigate to alphinium-assets submodule
cd PROJECTS/SUPPORTING/alphinium-assets

# Add screenshots
git add prototypes/screenshots/issue-324-*.png

# Commit
git commit -m "feat: Add screenshots for Strapi CMS integration prototype (Issue #324)"

# Push to submodule
git push origin main

# Update parent repo pointer
cd ../../../..
git add PROJECTS/SUPPORTING/alphinium-assets
git commit -m "chore: Update alphinium-assets with Strapi screenshots"
git push
```

## Valerie Advanced Features

### Interactive Screenshot

If Valerie supports interaction:

```bash
# Click button before screenshot
valerie screenshot http://localhost:19006 \
  --click "#test-connection-btn" \
  --wait 1000 \
  --output screenshots/after-connection.png
```

### Scroll and Capture

```bash
# Scroll to specific element
valerie screenshot http://localhost:19006 \
  --scroll-to ".articles-list" \
  --wait 500 \
  --output screenshots/articles-focused.png
```

### Multiple States

Capture app in different states:

```bash
# Error state
valerie screenshot http://localhost:19006 \
  --execute "window.setConnectionError('Connection failed')" \
  --wait 500 \
  --output screenshots/error-state.png

# Loading state
valerie screenshot http://localhost:19006 \
  --execute "window.setLoading(true)" \
  --wait 500 \
  --output screenshots/loading-state.png
```

## Troubleshooting

### Screenshot is Blank

- Increase `--wait` time (try 5000ms)
- Check if app loaded correctly in browser
- Verify URL is accessible from Valerie

### Content Not Showing

- Ensure services are running (Strapi + React Native)
- Check network connectivity
- Verify API token is configured
- Test URL in regular browser first

### Screenshot Quality

- Use higher resolution viewport (1920x1080)
- Enable retina/high-DPI mode if available
- Save as PNG for best quality
- Avoid JPEG for UI screenshots

### Valerie Not Available

If Valerie tool isn't accessible:

1. **Manual Screenshots:**
   - Open app in browser
   - Use browser dev tools (F12)
   - Device toolbar for mobile views
   - Take screenshots with OS tools

2. **Browser Automation:**
   ```bash
   # Use Puppeteer
   npm install puppeteer
   node capture-screenshot.js
   ```

3. **Playwright Alternative:**
   ```bash
   # Use Playwright
   npm install playwright
   npx playwright screenshot http://localhost:19006 screenshot.png
   ```

## Best Practices

### Before Screenshots

- ✓ Clear browser cache
- ✓ Use incognito/private window
- ✓ Disable browser extensions
- ✓ Set consistent viewport size
- ✓ Load sample data
- ✓ Test all interactive elements

### During Screenshots

- ✓ Wait for all content to load
- ✓ Capture in good UI state (no loading spinners)
- ✓ Show meaningful data (not empty states)
- ✓ Include branding/titles
- ✓ Capture multiple views/states

### After Screenshots

- ✓ Review images for quality
- ✓ Crop if needed (remove unnecessary borders)
- ✓ Compress for reasonable file sizes
- ✓ Add descriptive names
- ✓ Document what each shows
- ✓ Commit to correct location

## Screenshot Checklist

For Issue #324 documentation, capture:

- [ ] Main app view with connection status
- [ ] Articles list with sample data
- [ ] Create article form (filled in)
- [ ] Mobile responsive view
- [ ] Strapi admin panel showing content
- [ ] Strapi Content-Type Builder with Article model
- [ ] Connection test success state
- [ ] Error state (connection failed)
- [ ] Empty state (no articles)
- [ ] Loading state (fetching data)

## Linking to Issue

When adding screenshots to issue comments:

```markdown
## Screenshots

### Main App View
![Strapi Integration](../screenshots/issue-324-strapi-integration.png)

### Articles List
![Articles List](../screenshots/issue-324-strapi-articles-list.png)

### Strapi Admin Panel
![Strapi Admin](../screenshots/issue-324-strapi-admin.png)

See full prototype in: `PROJECTS/SUPPORTING/alphinium-assets/prototypes/react-native-strapi/`
```

## Alternative: Manual Screenshots

If Valerie isn't available:

### macOS

```bash
# Full screen
Cmd + Shift + 3

# Selection
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space
```

### Windows

```bash
# Full screen
PrtScn

# Active window
Alt + PrtScn

# Snipping Tool
Windows + Shift + S
```

### Linux

```bash
# Full screen
gnome-screenshot

# Selection
gnome-screenshot -a

# Window
gnome-screenshot -w
```

---

**Valerie Screenshot Guide for Issue #324 - Alphinium Platform**
