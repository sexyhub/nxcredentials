# Credential Vault

## Overview

A credential/password manager web application built with a pnpm workspace monorepo. Features user authentication with "remember me", admin settings, CRUD for credentials and categories, dashboard statistics.

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
│   ├── api-server/         # Express API server (auth, CRUD, settings)
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
- **Dashboard**: Stats overview with total credentials, categories, recently added (7 days), category breakdown
- **Credentials CRUD**: Add/edit/delete credentials via popup modals. Table view with copy email/password buttons, password reveal toggle, category filter, and search
- **Categories CRUD**: Manage categories (name + color) via popup modals with credential count
- **Admin Settings**: Toggle registration on/off, set site title, logo URL, favicon URL
- **Design**: Clean neutral light theme (warm stone tones), Bricolage Grotesque font, top header navigation (no sidebar), no shadows/gradients. Credentials displayed as card grid, categories as color tiles. Uses shadcn/ui components (Dialog, Switch, Checkbox, Combobox, Input, Button, Label)

## Database Schema

- **users**: id, username, passwordHash, isAdmin, createdAt
- **categories**: id, name, color, userId, createdAt
- **credentials**: id, title, email, password, userId, categoryId, createdAt, updatedAt
- **settings**: id, registrationEnabled, siteTitle, siteLogo, siteFavicon

## API Endpoints

All endpoints under `/api`:
- `POST /auth/register` — Register (first user becomes admin)
- `POST /auth/login` — Login with optional rememberMe
- `GET /auth/me` — Get current user
- `POST /auth/logout` — Log out
- `GET /credentials` — List credentials (with search/category filter)
- `POST /credentials` — Create credential
- `PATCH /credentials/:id` — Update credential
- `DELETE /credentials/:id` — Delete credential
- `GET /categories` — List categories with credential counts
- `POST /categories` — Create category
- `PATCH /categories/:id` — Update category
- `DELETE /categories/:id` — Delete category
- `GET /stats` — Dashboard statistics
- `GET /settings` — Get app settings (admin only)
- `PATCH /settings` — Update settings (admin only)
- `GET /settings/registration-status` — Public registration check

## Dev Commands

- `pnpm --filter @workspace/api-server run dev` — Start API server
- `pnpm --filter @workspace/web-app run dev` — Start frontend
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API types
- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm run typecheck` — Full typecheck
