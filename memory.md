# Boilerworks Memory

This file is the **AI context seed** for the Boilerworks Remix Full template. It captures decisions, constraints, and non-obvious facts that are not derivable from reading a single file.

For conventions and patterns, see [`bootstrap.md`](bootstrap.md).

---

## Template purpose

Catalogue template (not a support repo): server-first full-stack Remix 2 (React 18, Vite) application with Drizzle ORM on PostgreSQL, cookie-session auth, group-based permissions, forms engine, workflow engine, and a Tailwind dark admin theme.

---

## Key architectural decisions

| Decision                        | Why                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Session auth, not JWT           | bcrypt password hashing; session tokens SHA256-hashed before DB storage; `__session` cookie, 7-day expiry |
| Group-based RBAC                | Users -> groups -> permissions; every loader/action guards with `requirePermission()` / `requireAdmin()`  |
| Loaders/actions over API routes | Remix server-first model: loaders for reads, actions for mutations with Zod validation                    |
| `{ok, errors}` action pattern   | Every action returns `{ ok: boolean, errors?: Record<string, string[]> }`                                 |
| UUID primary keys everywhere    | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`; never auto-incrementing integers                         |
| Soft deletes                    | `deleted_at` / `deleted_by` on all tables; queries must filter with `isNull(table.deletedAt)`             |
| Audit logging                   | All mutations log via `logAudit()`                                                                        |
| Prices in cents                 | Integer column, never floats                                                                              |

---

## Non-obvious facts

- The dev server listens on **3006** (set in `vite.config.ts`). Docker Compose maps host **3000 -> 3006** in the container; PostgreSQL publishes on **5432**.
- Schema workflow uses `npm run db:push` (drizzle-kit push); no migration files have been generated yet, and the Dockerfile's `COPY drizzle` / migrate step depends on that gap being resolved (tracked in the fleet-audit issue).
- Installs currently require `npm install --legacy-peer-deps` (README/CI/Dockerfile) because `@types/react(-dom)` v19 is pinned against the React 18 runtime (tracked in the fleet-audit issue).
- Tests are Vitest with the happy-dom environment, in `tests/unit/`.
- Seeded dev credentials: `admin@boilerworks.dev` / `admin123` — development only; change before any deployment.
