# Boilerworks Remix Full -- Bootstrap

> Remix 2 full-stack application with Drizzle ORM, PostgreSQL, and session-based auth.

See the [Boilerworks Catalogue](../primers/CATALOGUE.md) for philosophy and universal patterns.

See the [stack primer](../primers/remix-full/PRIMER.md) for stack-specific conventions and build order.

## Architecture

```
Browser
  |
  v (HTTPS)
  |
Remix (Node.js / remix-serve)
  |-- loader functions (data fetching, SSR)
  |-- action functions (mutations, form handling)
  |-- Drizzle ORM -> PostgreSQL
  |-- Tailwind CSS (dark admin theme)
  +-- Session auth (cookie-based, SHA256-hashed tokens)
```

## Stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| Framework   | Remix 2 + React 18 + Vite                            |
| ORM         | Drizzle ORM                                          |
| Database    | PostgreSQL                                           |
| Auth        | Cookie session storage, bcrypt passwords             |
| Permissions | Group-based (users -> groups -> permissions)         |
| Validation  | Zod schemas in actions                               |
| Styling     | Tailwind CSS                                         |
| Testing     | Vitest                                               |
| Docker      | docker-compose (PostgreSQL + app)                    |
| CI          | GitHub Actions (lint, typecheck, test, build, audit) |

## Conventions

### Data Model

- UUID primary keys (`id uuid PRIMARY KEY DEFAULT gen_random_uuid()`)
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft deletes: `deleted_at`, `deleted_by` -- always filter with `isNull(table.deletedAt)`
- Price stored in cents (integer)

### Route Patterns

- Loaders for data fetching (GET)
- Actions for mutations (POST) with Zod validation
- Action return: `{ ok: boolean, errors?: Record<string, string[]> }`
- Admin routes nested under `/admin` layout route
- Permission checks in every loader/action

### Auth

- Cookie session with `__session` name
- Token hashed with SHA256 before DB storage
- Passwords hashed with bcrypt
- Session expiry: 7 days
- `requireAuth()` -- redirects to /login
- `requirePermission()` -- checks specific permission
- `requireAdmin()` -- checks admin.access or superuser

### Testing

- Vitest with happy-dom environment
- Test files in `tests/unit/` and `tests/integration/`
- No empty test bodies
- Test both allowed and denied permission cases

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start PostgreSQL (Docker)
cd docker && docker compose up db -d

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Start dev server
npm run dev
```

Default credentials: `admin@boilerworks.dev` / `admin123`

## Ports

- Remix: 3006
- PostgreSQL: 5451
