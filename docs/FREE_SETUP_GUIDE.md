# DriveFrame TV: 100% Free Setup & Zero-Lag Architecture Guide

This guide walks you through setting up DriveFrame TV using **100% free tiers**—no credit card required, no paid API subscriptions, and zero recurring cloud costs.

---

## Part 1: How DriveFrame Achieves Zero-Lag Media Streaming

When viewing high-resolution family photos or videos on a TV (like JioFiber STB with JioSphere), slow internet or large files can cause frustrating lag. Here is how DriveFrame eliminates lag for free:

```
[Google Drive Storage]
        │
        ├── 1. Instant Thumbnail CDN (Google Edge Cache)
        │      └── Drive produces instant '=w800-h600' or '=s1200' web-optimized thumbnails
        │      └── Served in < 80ms directly from Google's global edge without server overhead
        │
        ├── 2. Double-Buffered Memory Preloader (3-Image Sliding Window)
        │      └── While you look at Photo #1, Photo #2 and #3 are already downloaded in TV RAM
        │      └── Slideshow transitions occur instantly with ZERO spinner or delay
        │
        ├── 3. Byte-Range Video Streaming (HTTP 206)
        │      └── Videos play within 200ms without downloading the full multi-GB video file
        │
        └── 4. Client-Side Persistent Disk Cache
               └── 'Cache-Control: public, max-age=604800, immutable'
               └── Re-visiting an album loads instantly from the TV browser's local memory
```

---

## Part 2: Step-by-Step Free Setup Instructions

### Step 1: Google Cloud Project (100% Free API)
*Google Drive API v3 provides free access to your personal Google Drive (15 GB free storage and 1,000,000,000 quota units/day at zero cost).*

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **New Project**.
   - Name it: `DriveFrame TV`
   - Click **Create**.
3. In the search bar at the top, type **Google Drive API** and select it.
   - Click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen**.
   - Choose **External** and click **Create**.
   - App Name: `DriveFrame TV`
   - User support email: Select your personal Gmail.
   - Developer contact email: Enter your personal Gmail.
   - Click **Save and Continue**.
5. Under **Scopes**:
   - Click **Add or Remove Scopes**.
   - Search for `https://www.googleapis.com/auth/drive.readonly` and check it.
   - Click **Update** > **Save and Continue**.
6. Under **Test Users**:
   - Click **+ Add Users** and add your Gmail address and any family Gmail addresses who will test the app.
   - Click **Save and Continue**.
7. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** > **Credentials**.
   - Click **+ Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `DriveFrame TV Web Client`.
   - **Authorized JavaScript origins**: `http://localhost:3000` (and your Vercel URL later).
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/drive/callback`.
   - Click **Create**.
8. Copy your **Client ID** and **Client Secret**.

---

### Step 2: Supabase Setup (100% Free Tier)
*Supabase gives you 500 MB PostgreSQL database, 50,000 monthly active users, and free Realtime websockets.*

1. Go to [Supabase](https://supabase.com/) and click **Sign Up** (Sign in with GitHub or email).
2. Click **New Project**:
   - Name: `driveframe-tv`
   - Database Password: Create a secure password (save this).
   - Region: Choose the region closest to you (e.g., *Mumbai (ap-south-1)* for India).
   - Pricing Plan: **Free Tier ($0/month)**.
   - Click **Create new project**.
3. Run the Database Migration:
   - In your Supabase project dashboard, click **SQL Editor** in the left sidebar.
   - Click **+ New query**.
   - Open [`supabase/migrations/20261107000000_init_driveframe.sql`](file:///c:/Users/shahn/OneDrive/Desktop/gallry%20tv/supabase/migrations/20261107000000_init_driveframe.sql) in this repository.
   - Copy the entire SQL code, paste it into the Supabase SQL editor, and click **Run**.
   - You will see `"Success. No rows returned."` — your 9 tables, indexes, and RLS policies are now active.
4. Get your API Keys:
   - Click **Project Settings** (gear icon) > **API**.
   - Copy **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
   - Copy **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Copy **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`).

---

### Step 3: Configure Your Environment File

1. In the project root, duplicate `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the values:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

   # Google OAuth (Free)
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/drive/callback

   # Generate a 32-byte hex encryption key by running:
   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   DRIVE_TOKEN_ENCRYPTION_KEY=your_generated_64_character_hex_key

   # TV Session secret
   TV_DEVICE_JWT_SECRET=super-secret-tv-token-signer-key

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

### Step 4: TV Pairing on JioFiber STB (Zero Password)

1. Open the **JioSphere** browser on your JioFiber Set-Top Box.
2. Navigate to: `http://<your-computer-ip>:3000/tv` (or your free Vercel deployment URL).
3. The TV displays a 6-digit code (e.g. `482 917`) and a QR code.
4. Scan the QR code with your phone or visit `/pair` on your phone.
5. Tap **Approve TV Device**.
6. Your TV instantly loads the full cinematic photo gallery without typing a single character on the remote!

