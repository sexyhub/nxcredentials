# Credential Vault

## Overview

A credential/password manager web application built with a pnpm workspace monorepo. Features user authentication with "remember me", admin settings, CRUD for credentials and tags, dashboard statistics, multiple independent secure vaults (each with own password/PIN/color), and credential spaces (folder-like groupings with optional default type).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Framework**: Next.js 15 (App Router + Turbopack) — fullstack (API routes + pages)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Tailwind CSS v4 + shadcn/ui components
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Auth**: bcrypt + iron-session (cookie-based)
- **API Client**: Custom React Query hooks (hooks/use-api.ts)
- **Legacy (deprecated)**: Express API server (artifacts/api-server), React+Vite frontend (artifacts/web-app)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── next-app/              # Next.js fullstack app (primary)
│   │   ├── app/               # Next.js App Router pages + API routes
│   │   │   ├── api/           # API route handlers (auth, credentials, tags, etc.)
│   │   │   ├── login/         # Login page
│   │   │   ├── register/      # Register page
│   │   │   ├── credentials/   # Credentials page
│   │   │   ├── vault/[id]/    # Vault detail page
│   │   │   ├── spaces/        # Spaces page
│   │   │   ├── manage/        # Tags & service types management
│   │   │   ├── settings/      # Admin settings
│   │   │   ├── layout.tsx     # Root layout (Inter font, dark class, providers)
│   │   │   ├── globals.css    # Tailwind v4 theme + CSS variables
│   │   │   └── page.tsx       # Dashboard page
│   │   ├── components/        # UI components (shadcn + custom)
│   │   ├── hooks/             # React Query hooks (use-api.ts)
│   │   └── lib/               # Session config, utilities
│   ├── api-server/            # Legacy Express API server
│   └── web-app/               # Legacy React + Vite frontend
├── lib/
│   ├── db/                    # Drizzle ORM schema + DB connection
│   ├── api-spec/              # OpenAPI spec (legacy)
│   ├── api-client-react/      # Generated React Query hooks (legacy)
│   └── api-zod/               # Generated Zod schemas (legacy)
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Features

- **Authentication**: Login/Register with "Remember Me" checkbox (30-day session)
- **First user is admin**: The first registered account automatically gets admin privileges
- **Dashboard**: Stats overview with total credentials, tags, vaults, spaces. Three health-index ring cards (Vault protection %, Tag coverage %, Space allocation %) with color-coded status labels. Stacked color bar for tag distribution. Icon-grid for top service types. Bottom row: recently added (7d), service type count, oldest credential age, average age
- **Credentials CRUD**: Add/edit/delete credentials via popup modals. Card grid with copy email/password buttons, password reveal toggle, tag filter, type filter, and search. Vault credentials excluded from main list (shown in vault pages)
- **Credential Spaces**: Folder-like groupings with optional default type. Space tabs at top of credentials page for filtering. Create/delete spaces
- **Unified Manage page**: Tags + Service Types in one tabbed page — create/edit/delete tags, browse built-in service types
- **Multi-Vault System**: Multiple independent secure vaults, each with own name/password/PIN/color. Per-vault unlock with 15-min session expiry. Vault detail page shows credentials inside. Create/edit/delete vaults. Change vault password/PIN per-vault
- **Admin Settings**: Toggle registration on/off, set site title, site description, logo URL, favicon URL. All branding settings apply dynamically across login/register pages, header, browser tab title, and favicon
- **Design**: Clean neutral light theme (warm stone tones), Inter font, top header navigation (no sidebar), no shadows/gradients. Uses shadcn/ui components

## Database Schema

- **users**: id, username, passwordHash, isAdmin, createdAt
- **tags**: id, name, color, userId, createdAt
- **credentials**: id, title, email, password, userId, tagId, vaultId, spaceId, createdAt, updatedAt
- **vaults**: id, name, passwordHash, pinHash, color, icon, userId, createdAt
- **spaces**: id, name, defaultType, color, icon, userId, createdAt
- **settings**: id, registrationEnabled, siteTitle, siteDescription, siteLogo, siteFavicon

## API Endpoints

All endpoints under `/api` (served by Next.js route handlers in `artifacts/next-app/app/api/`):
- `POST /auth/register` — Register (first user becomes admin)
- `POST /auth/login` — Login with optional rememberMe
- `GET /auth/me` — Get current user
- `POST /auth/logout` — Log out
- `GET /credentials` — List credentials (with search/tag/spaceId/vaultId filter)
- `POST /credentials` — Create credential (with optional vaultId/spaceId)
- `PATCH /credentials/:id` — Update credential
- `DELETE /credentials/:id` — Delete credential
- `GET /tags` — List tags with credential counts
- `POST /tags` — Create tag
- `PATCH /tags/:id` — Update tag
- `DELETE /tags/:id` — Delete tag
- `GET /stats` — Dashboard statistics
- `GET /settings` — Get app settings (admin only)
- `PATCH /settings` — Update settings (admin only)
- `GET /settings/branding` — Public branding info
- `GET /settings/registration-status` — Public registration check
- `GET /vaults` — List all vaults for current user
- `POST /vaults` — Create a new vault
- `PATCH /vaults/:id` — Update vault
- `DELETE /vaults/:id` — Delete vault and all its credentials
- `POST /vaults/:id/verify` — Unlock vault (15-min session)
- `POST /vaults/:id/lock` — Lock vault
- `POST /vaults/:id/change-password` — Change vault password
- `POST /vaults/:id/change-pin` — Change vault PIN
- `GET /spaces` — List all spaces for current user
- `POST /spaces` — Create a space
- `PATCH /spaces/:id` — Update space
- `DELETE /spaces/:id` — Delete space

## Dev Commands

- `pnpm --filter @workspace/next-app run dev` — Start Next.js fullstack app (primary)
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm run typecheck` — Full typecheck

## Design Notes

- Nav active indicator: short centered 2px×12px left vertical bar, bolder text + thicker icon stroke; text nudged `translate-y-[0.4px]` for optical alignment
- `overflow-y: scroll` on `html` so scrollbar always reserves space
- Service types (`SERVICE_TYPES`) hardcoded in `artifacts/next-app/components/service-types.tsx` — the `title` field on credentials stores the type key string
- Credential `title` field stores service type key (e.g. "gmail", "github")
- Per-vault session tracking: iron-session stores `unlockedVaults` as `Record<number, number>` (vaultId → timestamp); vault routes check 15-min expiry
- Vault protection is enforced server-side: vault credential email/password are masked ("••••••••") in API responses unless vault session is active (15-min expiry after verify)
- Nav items: Dashboard, Spaces, Vaults, Manage (/manage), Settings
- Manage page route: `/manage` (was `/categories`)
- User dislikes: bottom border/underline, dot indicator, dark pill background for nav active state
- Next.js app uses basePath from BASE_PATH env var for path-based routing
- API hooks use NEXT_PUBLIC_BASE_PATH env var to prefix fetch URLs
