# Claude -- Boilerworks Remix Full

Primary conventions doc: [`bootstrap.md`](bootstrap.md)

Read it before writing any code.

## Stack

- **Framework**: Remix
- **UI**: React
- **Database**: D1 or Turso
- **Storage**: Cloudflare R2
- **Deployment**: Cloudflare Workers

## Edge Template

This is an edge template. Server-first React with loaders and actions. Production deployment targets Cloudflare Workers, not Docker. Local development uses `remix vite:dev`.

## Status

This template is planned. See the [stack primer](../primers/remix-full/PRIMER.md) for architecture decisions and build order.
