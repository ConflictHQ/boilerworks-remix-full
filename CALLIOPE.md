# Calliope — Boilerworks Remix Full
<!-- Agent shim for https://github.com/calliopeai/calliope-cli -->

Primary conventions doc: [`bootstrap.md`](bootstrap.md)
Context seed: [`memory.md`](memory.md)

Read both before writing any code.

---

## Project-specific notes

- Stack: Remix 2 (React 18, Vite), Drizzle ORM, PostgreSQL, Tailwind (dark admin theme), Vitest, Node 22.
- UUID primary keys; soft deletes (`deleted_at`/`deleted_by`) — filter with `isNull(table.deletedAt)` in queries.
- Zod validation in all action functions; actions return the `{ok, errors}` pattern; audit logging via `logAudit()`.
- Permission checks in loaders and actions via `requirePermission()`; all `/admin` routes require `admin.access` or superuser.
- Session auth (cookie sessions, SHA256 token hashing); group-based permissions (users → groups → permissions).
- Dev server on :3006 (`npm run dev`); Docker via `cd docker && docker compose up -d`.
