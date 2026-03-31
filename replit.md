# Credential Vault

## Overview

A credential/password manager web application built with Next.js. Features user authentication with Better Auth, admin settings, CRUD for credentials and tags, dashboard statistics, multiple independent secure vaults (each with own password/PIN/color), and credential spaces (folder-like groupings with optional default type).

## Stack

- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Framework**: Next.js 15 (App Router + Turbopack) — fullstack (API routes + pages)
- **Database**: Neon PostgreSQL (serverless) + Drizzle ORM
- **Auth**: Better Auth (email/password + username plugin, session cookies)
- **Frontend**: React 19 + Tailwind CSS v4 + shadcn/ui components
- **Validation**: Zod, `drizzle-zod`
- **API Client**: Custom React Query hooks (hooks/use-api.ts)

## Structure

```text
credential-vault/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # API route handlers (auth, credentials, tags, etc.)
│   │   ├── auth/           # Auth routes (Better Auth catch-all + custom register/login/me/logout)
│   │   ├── credentials/    # Credentials CRUD
│   │   ├── tags/           # Tags CRUD
│   │   ├── vaults/         # Vaults CRUD + verify/lock/change-password/change-pin
│   │   ├── spaces/         # Spaces CRUD
│   │   ├── settings/       # Settings + branding + registration-status
│   │   ├── stats/          # Dashboard statistics
│   │   └── service-types/  # Service types CRUD
│   ├── login/              # Login page
│   ├── register/           # Register page
│   ├── credentials/        # Credentials page
│   ├── vault/              # Vault detail page
│   ├── spaces/             # Spaces page
│   ├── manage/             # Tags & service types management
│   ├── settings/           # Admin settings
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Tailwind v4 theme + CSS variables
│   └── page.tsx            # Dashboard page
├── components/             # UI components (shadcn + custom)
├── hooks/                  # React Query hooks (use-api.ts, use-auth.ts)
├── lib/                    # Auth config, utilities
│   ├── auth.ts             # Better Auth server config (drizzle adapter, username plugin)
│   ├── auth-client.ts      # Better Auth React client
│   ├── auth-helpers.ts     # Server-side session helper (getAuthSession)
│   ├── crypto.ts           # Password hashing for vaults (scrypt-based)
│   ├── vault-state.ts      # Vault unlock state (signed cookie-based)
│   ├── vault-helpers.ts    # Vault unlock time checks
│   └── settings.ts         # Settings helper
├── db/                     # Drizzle ORM schema + DB connection
│   ├── index.ts            # Neon HTTP driver + drizzle instance
│   ├── drizzle.config.ts   # Drizzle Kit config (uses NEON_DATABASE_URL)
│   └── schema/             # Table definitions
│       ├── auth.ts          # Better Auth tables (user, session, account, verification)
│       ├── users.ts         # Re-exports user table as usersTable
│       ├── credentials.ts   # Credentials table
│       ├── tags.ts          # Tags table
│       ├── vaults.ts        # Vaults table
│       ├── spaces.ts        # Spaces table
│       ├── settings.ts      # Settings table
│       ├── service-types.ts # Service types table
│       └── index.ts         # Schema barrel exports
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── postcss.config.mjs      # PostCSS (Tailwind)
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies + scripts
```

## Auth System (Better Auth)

- **Library**: better-auth with username plugin
- **Session**: Cookie-based (`better-auth.session_token`), 7-day expiry
- **User table**: Better Auth managed (id=text UUID, name, email, username, isAdmin, etc.)
- **Registration**: Custom `/api/auth/register` route checks settings + first-user-is-admin logic, then calls Better Auth signUp internally
- **Login**: Custom `/api/auth/login` route calls Better Auth signInUsername
- **Session check**: `getAuthSession()` helper in `lib/auth-helpers.ts` used by all protected API routes
- **Vault passwords**: Hashed with Node.js crypto.scrypt (no bcrypt dependency)
- **Vault unlock state**: Stored in signed httpOnly cookie (`vault_unlock_state`)

## Environment Variables

- `NEON_DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Secret for Better Auth session signing
- `BETTER_AUTH_URL` — Base URL for Better Auth (set to Replit dev domain)

## Features

- **Authentication**: Login/Register with Better Auth (username-based)
- **First user is admin**: The first registered account automatically gets admin privileges
- **Dashboard**: Stats overview with total credentials, tags, vaults, spaces. Three health-index ring cards (Vault protection %, Tag coverage %, Space allocation %) with color-coded status labels
- **Credentials CRUD**: Add/edit/delete credentials via popup modals. Card grid with copy email/password buttons, password reveal toggle, tag filter, type filter, and search
- **Credential Spaces**: Folder-like groupings with optional default type (type dropdown uses live DB service types)
- **Unified Manage page**: Tags + Service Types in one tabbed page
- **Multi-Vault System**: Multiple independent secure vaults, each with own name/password/PIN/color. Per-vault unlock with 15-min session expiry
- **Admin Settings**: Toggle registration on/off, set site title, site description, logo URL, favicon URL
- **Credential Encryption**: email and password fields encrypted at rest using AES-256-GCM (ENCRYPTION_KEY env var)
- **Import/Export**: Export credentials as JSON (global, by space, or by vault scope); import from JSON export files with drag-and-drop

## Database Schema

- **user** (Better Auth): id (text PK), name, email, emailVerified, image, username, displayUsername, isAdmin, createdAt, updatedAt
- **session** (Better Auth): id, expiresAt, token, ipAddress, userAgent, userId
- **account** (Better Auth): id, accountId, providerId, userId, accessToken, refreshToken, password, etc.
- **verification** (Better Auth): id, identifier, value, expiresAt
- **tags**: id (serial), name, color, userId (text FK), createdAt
- **credentials**: id (serial), title, email, password, userId (text FK), tagId, vaultId, spaceId, createdAt, updatedAt
- **vaults**: id (serial), name, passwordHash, pinHash, color, icon, userId (text FK), createdAt
- **spaces**: id (serial), name, defaultType, color, icon, userId (text FK), createdAt
- **settings**: id (serial), registrationEnabled, siteTitle, siteDescription, siteLogo, siteFavicon
- **service_types**: id (serial), key, label, icon, color, createdAt

## Dev Commands

- `pnpm run dev` — Start Next.js app (dev mode with Turbopack)
- `pnpm run build` — Production build
- `pnpm run start` — Start production server
- `pnpm run db:push` — Push DB schema changes
- `pnpm run db:push-force` — Force push DB schema changes

## Design Notes

- Clean neutral light theme (warm stone tones), Inter font, top header navigation (no sidebar)
- Uses shadcn/ui components with Radix UI primitives
- Vault unlock state tracked via signed cookie (15-min expiry)
- Vault credentials are masked in API responses unless vault is actively unlocked
