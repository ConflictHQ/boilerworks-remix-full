# Boilerworks Remix Full

> Full-stack Remix application with Drizzle ORM, PostgreSQL, session auth, and dark admin theme.

Remix 2 full-stack template. Server-first React with loaders and actions, Drizzle ORM for PostgreSQL, session-based authentication with group-based permissions, forms engine, workflow engine, and a Tailwind dark admin panel.

## Quick Start

```bash
# Install
npm install --legacy-peer-deps

# Start PostgreSQL
cd docker && docker compose up db -d && cd ..

# Push schema and seed
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Login with `admin@boilerworks.dev` / `admin123`.

## Features

- **Remix 2** with React 18, Vite, TypeScript
- **Drizzle ORM** with PostgreSQL
- **Session auth** with cookie sessions and SHA256 token hashing
- **Group-based permissions** (users, groups, permissions)
- **Items + Categories CRUD** with loaders/actions
- **Forms engine** with dynamic JSON schema definitions
- **Workflow engine** with state machine transitions
- **Dark admin theme** (Tailwind CSS, Boilerworks branding)
- **Vitest** test suite
- **Docker Compose** for local development
- **GitHub Actions CI** (lint, typecheck, test, build, audit)
- **Audit logging** for all mutations
- UUID primary keys, soft deletes on all tables

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server (port 3006) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | ESLint + Prettier check |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed sample data |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [bootstrap.md](bootstrap.md).

---

Boilerworks is a [Conflict](https://weareconflict.com) brand. CONFLICT is a registered trademark of Conflict LLC.
