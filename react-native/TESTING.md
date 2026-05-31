# Testing Guide - React Native Strapi Prototype

Complete testing procedures for the enhanced mobile app (Issue #448).

## 📋 Testing Checklist

### Pre-Test Setup
- [ ] Node.js 20.x installed
- [ ] Expo CLI available
- [ ] Strapi backend running
- [ ] iOS Simulator / Android Emulator ready
- [ ] API token configured

## 🧪 Manual Testing

### 1. Connection & Setup

**Test:** Initial connection
- [ ] Start the app
- [ ] Check online indicator shows 🟢 Online
- [ ] Pull to refresh
- [ ] Verify last sync time updates

**Test:** Offline mode
- [ ] Turn off network / stop Strapi
- [ ] Check offline indicator shows 🔴 Offline
- [ ] Verify cached articles still visible
- [ ] Check pending operations counter

### 2. CRUD Operations

#### Create Article
- [ ] Fill in title and content
- [ ] Click "Create" button
- [ ] Verify haptic feedback
- [ ] Verify success alert
- [ ] Check article appears in list
- [ ] Verify form clears after creation

**Edge Cases:**
- [ ] Try creating with empty title → Should show error
- [ ] Try creating with empty content → Should show error
- [ ] Create while offline → Should queue operation
- [ ] Create with very long title (1000+ chars)
- [ ] Create with special characters: `<>&"'`

#### Read Articles
- [ ] Verify articles load on app start (from cache)
- [ ] Pull to refresh
- [ ] Verify loading skeleton appears
- [ ] Tap article to view details
- [ ] Check modal opens with full content
- [ ] Verify close button works

**Edge Cases:**
- [ ] Empty article list → Check empty state message
- [ ] Very long article content (10,000+ chars)
- [ ] Article with line breaks and formatting
- [ ] Load with 100+ articles → Check performance

#### Update Article
- [ ] Tap edit (✏️) on an article
- [ ] Verify form pre-fills with existing data
- [ ] Modify title and content
- [ ] Click "Update" button
- [ ] Verify haptic feedback
- [ ] Verify success alert
- [ ] Check article updates in list
- [ ] Test cancel button clears edit mode

**Edge Cases:**
- [ ] Update while offline → Should queue operation
- [ ] Update then cancel → Should revert form
- [ ] Update with empty fields → Should show error

#### Delete Article
- [ ] Tap delete (🗑️) on an article
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" → Article remains
- [ ] Click "Delete" → Article removed
- [ ] Verify haptic feedback
- [ ] Check success alert

**Edge Cases:**
- [ ] Delete while offline → Should queue operation
- [ ] Delete last article → Check empty state
- [ ] Rapid delete multiple articles

### 3. Offline Support

**Test:** Offline caching
- [ ] Fetch articles while online
- [ ] Turn off network
- [ ] Restart app
- [ ] Verify articles still visible (from cache)
- [ ] Check last sync time persists

**Test:** Offline queue
- [ ] Turn off network
- [ ] Create new article
- [ ] Update existing article
- [ ] Delete an article
- [ ] Verify operations queued (check counter)
- [ ] Turn network back on
- [ ] Verify auto-sync occurs
- [ ] Check all operations completed
- [ ] Verify queue counter resets to 0

**Test:** Queue persistence
- [ ] Turn off network
- [ ] Perform several operations
- [ ] Close app (force quit)
- [ ] Turn network back on
- [ ] Reopen app
- [ ] Verify queued operations sync

### 4. Search & Sort

**Test:** Search functionality
- [ ] Type in search box
- [ ] Verify real-time filtering
- [ ] Search by title
- [ ] Search by content
- [ ] Clear search (empty text)
- [ ] Verify all articles return

**Edge Cases:**
- [ ] Search with no matches → Check empty state
- [ ] Search special characters
- [ ] Case-insensitive search
- [ ] Search partial words

**Test:** Sort functionality
- [ ] Click "Date" sort button
- [ ] Verify articles sorted newest first
- [ ] Click "Title" sort button
- [ ] Verify alphabetical order
- [ ] Click "Author" sort button
- [ ] Verify sort by author
- [ ] Check active button highlighted

### 5. Pull-to-Refresh

**Test:** Basic refresh
- [ ] Pull down on article list
- [ ] Verify refresh animation
- [ ] Check articles reload
- [ ] Verify last sync time updates

**Test:** Debounce
- [ ] Rapidly pull multiple times
- [ ] Verify only one request made
- [ ] Check no duplicate articles

**Test:** Error handling
- [ ] Turn off network
- [ ] Pull to refresh
- [ ] Verify error message
- [ ] Verify haptic error feedback
- [ ] Check retry option

### 6. Loading States

**Test:** Skeleton screens
- [ ] Clear cache
- [ ] Restart app
- [ ] Fetch articles
- [ ] Verify skeleton cards appear
- [ ] Check shimmer animation
- [ ] Verify proper transition to content

**Test:** Button loading
- [ ] Click create button
- [ ] Verify button shows "⏳ Saving..."
- [ ] Check button disabled during operation
- [ ] Verify button re-enables after completion

**Test:** Request cancellation
- [ ] Start fetching articles
- [ ] Immediately navigate away (or fetch again)
- [ ] Verify previous request cancelled
- [ ] Check no duplicate data

### 7. Draft System

**Test:** Save draft
- [ ] Fill in title and content
- [ ] Click "Save Draft" button
- [ ] Verify success alert
- [ ] Check draft counter shows "1 Draft"
- [ ] Clear form and create another draft
- [ ] Verify counter updates

**Test:** Load draft
- [ ] Click draft counter button
- [ ] Verify modal opens with draft list
- [ ] Click "Load" on a draft
- [ ] Verify form populates with draft data
- [ ] Check modal closes

**Test:** Delete draft
- [ ] Open draft modal
- [ ] Click "Delete" on a draft
- [ ] Verify draft removed from list
- [ ] Check counter updates

**Test:** Draft persistence
- [ ] Save several drafts
- [ ] Close app
- [ ] Reopen app
- [ ] Verify drafts still available

### 8. Bookmarks

**Test:** Toggle bookmark
- [ ] Click star (☆) on an article
- [ ] Verify changes to filled star (⭐)
- [ ] Verify haptic feedback
- [ ] Click again to remove bookmark
- [ ] Verify returns to empty star

**Test:** Bookmark persistence
- [ ] Bookmark several articles
- [ ] Close app
- [ ] Reopen app
- [ ] Verify bookmarks persist
- [ ] Check star indicators correct

### 9. Share Functionality

**Test:** Share article
- [ ] Tap share (📤) on an article
- [ ] Verify native share dialog opens
- [ ] Check article title and content included
- [ ] Test cancel
- [ ] Test share to different apps (if available)

### 10. Haptic Feedback

**Test on physical device:**
- [ ] Tap any button → Light vibration (20ms)
- [ ] Successful operation → Success vibration (50ms)
- [ ] Error operation → Error pattern (100-50-100ms)
- [ ] Toggle bookmark → Light vibration
- [ ] Start edit → Light vibration

### 11. Accessibility

**Test with screen reader:**
- [ ] Enable VoiceOver (iOS) / TalkBack (Android)
- [ ] Navigate through all buttons
- [ ] Verify all have accessibility labels
- [ ] Check meaningful role descriptions
- [ ] Test form inputs are readable
- [ ] Verify article content readable

**Test touch targets:**
- [ ] Check all buttons 44x44 minimum
- [ ] Verify comfortable tap areas
- [ ] Test with large fingers / stylus

### 12. Error Handling

**Test:** Network errors
- [ ] Turn off network during fetch
- [ ] Verify user-friendly error message
- [ ] Check retry button appears
- [ ] Click retry
- [ ] Verify request retries

**Test:** API errors
- [ ] Use invalid API token
- [ ] Attempt operations
- [ ] Verify 401/403 errors caught
- [ ] Check error messages helpful

**Test:** Error boundary
- [ ] Force a React error (modify code temporarily)
- [ ] Verify error boundary catches it
- [ ] Check fallback UI appears
- [ ] Test "Try Again" button

**Test:** Retry mechanism
- [ ] Simulate intermittent connection
- [ ] Make API request
- [ ] Verify automatic retries (up to 3)
- [ ] Check exponential backoff delays
- [ ] Verify gives up after 3 attempts

### 13. Form Validation

**Test:** Real-time validation
- [ ] Start typing in title field
- [ ] Clear title field
- [ ] Try to submit → Should show error
- [ ] Type content only
- [ ] Try to submit → Should show error for title

**Test:** Empty state handling
- [ ] Submit completely empty form
- [ ] Verify error alert
- [ ] Check form not cleared
- [ ] Fill one field only
- [ ] Verify still shows error

## 📱 Platform Testing

### iOS Simulator

**Recommended:** iPhone 14 Pro

**Tests:**
- [ ] App launches successfully
- [ ] All features work correctly
- [ ] Haptic feedback works
- [ ] Keyboard handling proper
- [ ] Safe area (notch) handled
- [ ] Gestures work smoothly
- [ ] Pull-to-refresh feels native
- [ ] Modals animate correctly

**iOS-Specific:**
- [ ] Status bar styling
- [ ] Keyboard avoid view behavior
- [ ] Share sheet appearance
- [ ] VoiceOver support

### Android Emulator

**Recommended:** Pixel 6

**Tests:**
- [ ] App launches successfully
- [ ] All features work correctly
- [ ] Haptic feedback works
- [ ] Back button handling
- [ ] Keyboard handling proper
- [ ] Pull-to-refresh feels native
- [ ] Modals animate correctly

**Android-Specific:**
- [ ] Material design compliance
- [ ] System navigation
- [ ] TalkBack support
- [ ] Share intent handling

### Web Browser

**Tests:**
- [ ] App loads in browser
- [ ] Core features work
- [ ] Responsive layout
- [ ] Mouse/keyboard input
- [ ] No mobile-only crashes

**Limitations:** (Known)
- Haptic feedback not available
- Share may use different API
- Storage works with localStorage

## 🎯 Edge Cases & Stress Tests

### Large Dataset
- [ ] Create 100+ articles
- [ ] Test scroll performance
- [ ] Check search speed
- [ ] Verify sort performance
- [ ] Test cache size

### Rapid Actions
- [ ] Rapid successive creates
- [ ] Quick edit then delete
- [ ] Fast pull-to-refresh spam
- [ ] Rapid search typing
- [ ] Quick bookmark toggles

### Long Content
- [ ] Article with 10,000+ words
- [ ] Title with 500+ characters
- [ ] Content with special formatting
- [ ] Unicode characters (emoji, CJK, etc.)
- [ ] Mixed content (numbers, symbols)

### Poor Network
- [ ] Slow connection (throttle to 3G)
- [ ] Intermittent connection
- [ ] High latency (500ms+)
- [ ] Packet loss simulation
- [ ] Timeout scenarios

### App Lifecycle
- [ ] Background app
- [ ] Foreground app
- [ ] App minimized for 1 hour
- [ ] Device sleep/wake
- [ ] Memory pressure scenarios

### Storage Limits
- [ ] Fill cache with 1000+ articles
- [ ] Save 50+ drafts
- [ ] Queue 100+ offline operations
- [ ] Check storage usage
- [ ] Verify cleanup works

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **No image upload** - Text only for now
2. **No rich text** - Plain text content
3. **No push notifications** - Infrastructure not ready
4. **Author field** - Not implemented in Strapi model
5. **No multi-user** - Single user mode

### Expected Behaviors:
- Offline queue syncs automatically when online
- Cache persists until cleared
- Drafts saved locally only
- Bookmarks local to device

## 📊 Performance Benchmarks

### Target Metrics:
- Cold start: < 2 seconds
- Article load: < 500ms
- Search response: < 100ms
- Smooth 60fps scrolling
- Memory: < 100MB

### Measure:
- React DevTools Profiler
- Chrome DevTools Performance
- React Native Performance Monitor
- Memory profiler

## ✅ Test Completion Checklist

### Functional Tests
- [ ] All CRUD operations work
- [ ] Offline support functional
- [ ] Pull-to-refresh works
- [ ] Error handling comprehensive
- [ ] Loading states proper
- [ ] Search & sort correct
- [ ] Drafts save/load
- [ ] Bookmarks persist
- [ ] Share works

### Non-Functional Tests
- [ ] Performance acceptable
- [ ] UI polished
- [ ] Haptic feedback present
- [ ] Accessibility compliant
- [ ] Error messages helpful
- [ ] No console errors
- [ ] No memory leaks
- [ ] Battery efficient

### Platform Tests
- [ ] iOS Simulator tested
- [ ] Android Emulator tested
- [ ] Web version tested
- [ ] Physical device tested (if available)

### Documentation
- [ ] README updated
- [ ] FEATURES.md complete
- [ ] TESTING.md complete
- [ ] Code commented
- [ ] Issues documented

## 🚀 Ready for Demo

Once all tests pass:
- ✅ Code committed
- ✅ PR created
- ✅ Documentation complete
- ✅ Demo ready
- ✅ Screenshots captured

## 📝 Test Results Template

```
## Test Session: [Date]
**Tester:** [Name]
**Platform:** iOS/Android/Web
**Device:** [Device Name]

### Passed Tests: X/Y
- [✅/❌] Test Name
- [✅/❌] Test Name

### Issues Found:
1. [Description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Performance:
- Cold start: Xs
- Load time: Xms
- Memory: XMB

### Notes:
[Additional observations]
```

---

**Last Updated:** January 9, 2026  
**Issue:** #448 - Complete Mobile Features  
**Status:** Ready for testing ✅
