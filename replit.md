# Credential Vault

## Overview

A credential/password manager web application built with Next.js. Features user authentication with "remember me", admin settings, CRUD for credentials and tags, dashboard statistics, multiple independent secure vaults (each with own password/PIN/color), and credential spaces (folder-like groupings with optional default type).

## Stack

- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Framework**: Next.js 15 (App Router + Turbopack) — fullstack (API routes + pages)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React 19 + Tailwind CSS v4 + shadcn/ui components
- **Validation**: Zod, `drizzle-zod`
- **Auth**: bcrypt + iron-session (cookie-based)
- **API Client**: Custom React Query hooks (hooks/use-api.ts)

## Structure

```text
credential-vault/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # API route handlers (auth, credentials, tags, etc.)
│   ├── (pages)/            # UI pages
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   ├── credentials/    # Credentials page
│   │   ├── vault/[id]/     # Vault detail page
│   │   ├── spaces/         # Spaces page
│   │   ├── manage/         # Tags & service types management
│   │   └── settings/       # Admin settings
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Tailwind v4 theme + CSS variables
│   └── page.tsx            # Dashboard page
├── components/             # UI components (shadcn + custom)
├── hooks/                  # React Query hooks (use-api.ts)
├── lib/                    # Session config, utilities
├── db/                     # Drizzle ORM schema + DB connection
│   ├── index.ts            # DB pool + drizzle instance
│   ├── drizzle.config.ts   # Drizzle Kit config
│   └── schema/             # Table definitions
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
├── postcss.config.mjs      # PostCSS (Tailwind)
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies + scripts
```

## Features

- **Authentication**: Login/Register with "Remember Me" checkbox (30-day session)
- **First user is admin**: The first registered account automatically gets admin privileges
- **Dashboard**: Stats overview with total credentials, tags, vaults, spaces. Three health-index ring cards (Vault protection %, Tag coverage %, Space allocation %) with color-coded status labels. Stacked color bar for tag distribution. Icon-grid for top service types
- **Credentials CRUD**: Add/edit/delete credentials via popup modals. Card grid with copy email/password buttons, password reveal toggle, tag filter, type filter, and search. Vault credentials excluded from main list
- **Credential Spaces**: Folder-like groupings with optional default type. Space tabs at top of credentials page
- **Unified Manage page**: Tags + Service Types in one tabbed page
- **Multi-Vault System**: Multiple independent secure vaults, each with own name/password/PIN/color. Per-vault unlock with 15-min session expiry
- **Admin Settings**: Toggle registration on/off, set site title, site description, logo URL, favicon URL

## Database Schema

- **users**: id, username, passwordHash, isAdmin, createdAt
- **tags**: id, name, color, userId, createdAt
- **credentials**: id, title, email, password, userId, tagId, vaultId, spaceId, createdAt, updatedAt
- **vaults**: id, name, passwordHash, pinHash, color, icon, userId, createdAt
- **spaces**: id, name, defaultType, color, icon, userId, createdAt
- **settings**: id, registrationEnabled, siteTitle, siteDescription, siteLogo, siteFavicon
- **serviceTypes**: id, key, label, icon, color, userId, isCustom, createdAt

## API Endpoints

All endpoints under `/api` (served by Next.js route handlers in `app/api/`):
- `POST /api/auth/register` — Register (first user becomes admin)
- `POST /api/auth/login` — Login with optional rememberMe
- `GET /api/auth/me` — Get current user
- `POST /api/auth/logout` — Log out
- `GET /api/credentials` — List credentials (with search/tag/spaceId/vaultId filter)
- `POST /api/credentials` — Create credential
- `PATCH /api/credentials/:id` — Update credential
- `DELETE /api/credentials/:id` — Delete credential
- `GET /api/tags` — List tags with credential counts
- `POST /api/tags` — Create tag
- `PATCH /api/tags/:id` — Update tag
- `DELETE /api/tags/:id` — Delete tag
- `GET /api/stats` — Dashboard statistics
- `GET /api/settings` — Get app settings (admin only)
- `PATCH /api/settings` — Update settings (admin only)
- `GET /api/settings/branding` — Public branding info
- `GET /api/settings/registration-status` — Public registration check
- `GET /api/vaults` — List all vaults
- `POST /api/vaults` — Create a new vault
- `PATCH /api/vaults/:id` — Update vault
- `DELETE /api/vaults/:id` — Delete vault and all its credentials
- `POST /api/vaults/:id/verify` — Unlock vault (15-min session)
- `POST /api/vaults/:id/lock` — Lock vault
- `POST /api/vaults/:id/change-password` — Change vault password
- `POST /api/vaults/:id/change-pin` — Change vault PIN
- `GET /api/spaces` — List all spaces
- `POST /api/spaces` — Create a space
- `PATCH /api/spaces/:id` — Update space
- `DELETE /api/spaces/:id` — Delete space
- `GET /api/service-types` — List service types
- `POST /api/service-types` — Create service type
- `PATCH /api/service-types/:id` — Update service type
- `DELETE /api/service-types/:id` — Delete service type

## Dev Commands

- `pnpm run dev` — Start Next.js app (dev mode with Turbopack)
- `pnpm run build` — Production build
- `pnpm run start` — Start production server
- `pnpm run db:push` — Push DB schema changes
- `pnpm run db:push-force` — Force push DB schema changes

## Design Notes

- Clean neutral light theme (warm stone tones), Inter font, top header navigation (no sidebar)
- Uses shadcn/ui components with Radix UI primitives
- Per-vault session tracking via iron-session
- Vault credentials are masked in API responses unless vault session is active
