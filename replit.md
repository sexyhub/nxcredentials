# Credential Vault

## Overview

A credential/password manager web application built with a pnpm workspace monorepo. Features user authentication with "remember me", admin settings, CRUD for credentials and categories, dashboard statistics, password-protected secure vault for high-value credentials.

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
│   ├── api-server/         # Express API server (auth, CRUD, settings, vault)
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
- **Dashboard**: Stats overview with total credentials, categories, recently added (7 days), vault count, unique types, oldest/average credential age, vault ratio, category breakdown, service type breakdown
- **Credentials CRUD**: Add/edit/delete credentials via popup modals. Card grid with copy email/password buttons, password reveal toggle, category filter, type filter, and search. Vault credentials shown in separate "Secure vault" section
- **Unified Manage page**: Tags + Service Types in one tabbed page — create/edit/delete tags, browse built-in service types
- **Secure Vault**: Password + PIN protected section for high-value credentials. Vault setup and password/PIN change available in Settings. Vault unlock via password or PIN on the credentials page
- **Admin Settings**: Toggle registration on/off, set site title, logo URL, favicon URL
- **Settings (all users)**: Vault password/PIN setup and management
- **Design**: Clean neutral light theme (warm stone tones), Bricolage Grotesque font, top header navigation (no sidebar), no shadows/gradients. Uses shadcn/ui components

## Database Schema

- **users**: id, username, passwordHash, isAdmin, vaultPasswordHash, vaultPinHash, createdAt
- **categories**: id, name, color, userId, createdAt
- **credentials**: id, title, email, password, userId, categoryId, isVault, createdAt, updatedAt
- **settings**: id, registrationEnabled, siteTitle, siteLogo, siteFavicon

## API Endpoints

All endpoints under `/api`:
- `POST /auth/register` — Register (first user becomes admin)
- `POST /auth/login` — Login with optional rememberMe
- `GET /auth/me` — Get current user
- `POST /auth/logout` — Log out
- `GET /credentials` — List credentials (with search/category filter)
- `POST /credentials` — Create credential (supports `isVault` flag)
- `PATCH /credentials/:id` — Update credential
- `DELETE /credentials/:id` — Delete credential
- `GET /categories` — List categories with credential counts
- `POST /categories` — Create category
- `PATCH /categories/:id` — Update category
- `DELETE /categories/:id` — Delete category
- `GET /stats` — Dashboard statistics (expanded with vault/type/age metrics)
- `GET /settings` — Get app settings (admin only)
- `PATCH /settings` — Update settings (admin only)
- `GET /settings/registration-status` — Public registration check
- `GET /vault/status` — Check if vault password/PIN are set up
- `POST /vault/setup` — Set up vault password and PIN
- `POST /vault/verify` — Verify vault password or PIN to unlock (sets 15-min server session)
- `POST /vault/lock` — Lock the vault (clears server session)
- `POST /vault/change-password` — Change vault password (requires old password)
- `POST /vault/change-pin` — Change vault PIN (requires old PIN)

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
- Vault credentials shown in amber-accented separate section with lock/unlock toggle
- Vault protection is enforced server-side: vault credential email/password are masked ("••••••••") in API responses unless vault session is active (15-min expiry after verify)
