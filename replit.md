# Credential Vault

## Overview

A credential/password manager web application built with a pnpm workspace monorepo. Features user authentication with "remember me", admin settings, CRUD for credentials and tags, dashboard statistics, multiple independent secure vaults (each with own password/PIN/color), and credential spaces (folder-like groupings with optional default type).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS v4
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: bcrypt + express-session (cookie-based)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, CRUD, settings, vaults, spaces)
│   └── web-app/            # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
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
- **Admin Settings**: Toggle registration on/off, set site title, logo URL, favicon URL
- **Design**: Clean neutral light theme (warm stone tones), Bricolage Grotesque font, top header navigation (no sidebar), no shadows/gradients. Uses shadcn/ui components

## Database Schema

- **users**: id, username, passwordHash, isAdmin, createdAt
- **tags**: id, name, color, userId, createdAt
- **credentials**: id, title, email, password, userId, tagId, vaultId, spaceId, createdAt, updatedAt
- **vaults**: id, name, passwordHash, pinHash, color, icon, userId, createdAt
- **spaces**: id, name, defaultType, color, icon, userId, createdAt
- **settings**: id, registrationEnabled, siteTitle, siteLogo, siteFavicon

## API Endpoints

All endpoints under `/api`:
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
- `GET /stats` — Dashboard statistics (totalCredentials, totalTags, totalSpaces, totalVaults, vaultCredentials, etc.)
- `GET /settings` — Get app settings (admin only)
- `PATCH /settings` — Update settings (admin only)
- `GET /settings/registration-status` — Public registration check
- `GET /vaults` — List all vaults for current user
- `POST /vaults` — Create a new vault (name, password, PIN, color, icon)
- `PATCH /vaults/:id` — Update vault (name, color, icon)
- `DELETE /vaults/:id` — Delete vault and all its credentials
- `POST /vaults/:id/verify` — Unlock vault (password or PIN, sets 15-min server session)
- `POST /vaults/:id/lock` — Lock vault (clears session for that vault)
- `POST /vaults/:id/change-password` — Change vault password
- `POST /vaults/:id/change-pin` — Change vault PIN
- `GET /spaces` — List all spaces for current user
- `POST /spaces` — Create a space (name, optional defaultType/color/icon)
- `PATCH /spaces/:id` — Update space
- `DELETE /spaces/:id` — Delete space (credentials become unassigned)

## Dev Commands

- `pnpm --filter @workspace/api-server run dev` — Start API server
- `pnpm --filter @workspace/web-app run dev` — Start frontend
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API types
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm run typecheck` — Full typecheck

## Design Notes

- Nav active indicator: short centered 2px×12px left vertical bar, bolder text + thicker icon stroke; text nudged `translate-y-[0.4px]` for optical alignment
- `overflow-y: scroll` on `html` so scrollbar always reserves space
- Service types (`SERVICE_TYPES`) hardcoded in `artifacts/web-app/src/lib/service-types.tsx` — the `title` field on credentials stores the type key string
- Credential `title` field stores service type key (e.g. "gmail", "github")
- Per-vault session tracking: `req.session.unlockedVaults` is `Record<number, number>` (vaultId → timestamp); `isVaultUnlocked(req, vaultId)` checks expiry
- Vault protection is enforced server-side: vault credential email/password are masked ("••••••••") in API responses unless vault session is active (15-min expiry after verify)
- Nav items: Dashboard, Spaces, Vaults, Manage (/manage), Settings
- Manage page route: `/manage` (was `/categories`)
- User dislikes: bottom border/underline, dot indicator, dark pill background for nav active state
