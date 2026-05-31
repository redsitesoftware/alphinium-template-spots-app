# Spots App — Going Live Checklist

## Overview
Community location-sharing app. Generalised "hidden gem" map platform. Revenue via alphinium-ads + premium features.

## Step 1: Real Backend
1. Supabase for spot storage, user auth, image storage
2. alphinium-auth → real Google/Facebook OAuth (already wired in demo)
3. Spots table: `{ id, lat, lng, name, category, description, photos[], rating, submitter_id, verified }`

## Step 2: Real Maps
- alphinium-maps replacing react-leaflet
- Custom category icons per spot type
- Clustering at zoom-out, individual pins on zoom-in
- "Near me" filter using device GPS

## Step 3: Social Features
- User profiles with submitted spots count
- Follow other users, see their spots
- "Save" a spot to personal collection
- Share spot → native share sheet (WhatsApp, Instagram Story deep link)

## Step 4: Moderation
- Report a spot (inappropriate / closed / wrong location)
- Admin review queue
- Community "verified" voting (3 upvotes = verified badge)

## Step 5: Monetisation
| Stream | Details |
|---|---|
| alphinium-ads | Banner + native ads in feed |
| Premium membership | $2.99/mo — ad-free + offline maps + early access |
| Business listings | $19/mo — claim spot, add photos, booking link |
| Data partnerships | Aggregate anonymous trend data to tourism boards |

## Step 6: Deploy
- Web: `spots.alphinium.com`
- iOS/Android priority (GPS-dependent app, mobile-first)
- Onboarding flow: "Add your first spot" to drive content seeding
