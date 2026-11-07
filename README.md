# DriveFrame TV

> Private, family-accessible photo gallery turning your Google Drive into a television-friendly digital photo library and cinematic ambient frame.

## 🚀 Key Features

- **Website First · TV App Second**: Optimized for desktop, mobile touch, and the 1080p **JioSphere TV browser on JioFiber STB**.
- **Original Source Integrity**: Photos remain in your Google Drive; no secondary cloud duplication.
- **Single-Owner, Multi-Family Access**: Owner connects Drive once via OAuth; family members browse with their own Google identity.
- **Zero-Password TV Pairing**: Connect your TV in seconds using a 6-digit code or mobile QR scan.
- **Cinematic 10-Foot Slideshow**: Framer Motion transitions (Ken Burns & Crossfade), 3-image memory-safe preloading, and Ambient clock mode.
- **D-Pad Spatial Navigation**: Custom Euclidean distance focus manager for smart TV remotes.

## 📚 Technical Documentation

- **[Master Development Specification](docs/MASTER_SPECIFICATION.md)**: Full database schema (DDL & RLS), API endpoints, spatial navigation algorithm, and security protocols.
- **[Database Migration](supabase/migrations/20261107000000_init_driveframe.sql)**: Production-ready PostgreSQL migration script for Supabase.
- **[Shared Types](packages/shared-types/index.ts)**: TypeScript contracts across frontend and backend.

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router, TypeScript)
- **Styling**: Tailwind CSS (with 10-foot TV overscan guards and typography tokens)
- **Motion**: Framer Motion
- **Database & Auth**: Supabase (PostgreSQL 15+, Auth, Realtime, RLS)
- **Drive API**: Google Drive API v3 (`drive.readonly`)
- **Security**: AES-256-GCM Token Vault, HMAC TV device session tokens

---
*Created for DriveFrame TV.*

