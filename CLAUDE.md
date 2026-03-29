# Claude -- Boilerworks Remix Full

Primary conventions doc: [`bootstrap.md`](bootstrap.md)

Read it before writing any code.

## Stack

- **Framework**: Remix 2 (React 18, Vite)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (port 5432)
- **Auth**: Session-based (cookie sessions, SHA256 token hashing)
- **Permissions**: Group-based (users -> groups -> permissions)
- **Styling**: Tailwind CSS (dark admin theme)
- **Testing**: Vitest
- **Runtime**: Node 22

## Quick Reference

```bash
npm run dev          # Start dev server on :3006
npm test             # Run tests
npm run lint         # ESLint + Prettier check
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
```

## Conventions

- UUID primary keys on all tables
- Soft deletes (`deleted_at` / `deleted_by`) -- filter with `isNull(table.deletedAt)` in queries
- Zod validation in all action functions
- `{ok, errors}` pattern for action return values
- Audit logging for all mutations via `logAudit()`
- Permission checks in loaders and actions via `requirePermission()`
- All routes under `/admin` require `admin.access` permission or superuser status

## Docker

```bash
cd docker && docker compose up -d
```

Ports: Remix 3000, PostgreSQL 5432.
