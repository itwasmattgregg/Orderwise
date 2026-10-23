# Orderwise

Shared standing orders for bakeries and coffee shops — quantities, assortment, thread, settlement, and super-simple inventory for either side.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (local demo)
- Cookie session (demo passwords)

## Setup

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

| Role   | Email                 | Password |
|--------|-----------------------|----------|
| Cafe   | `maya@cafeluna.test`  | `demo`   |
| Bakery | `owen@rivertown.test` | `demo`   |

## What’s in the MVP

- Shared **agreement home** (Cafe Luna ↔ Rivertown Bakery)
- Assortment (what can be requested on this relationship)
- Per-delivery qty steppers + after-cutoff request/confirm (demo checkbox)
- Thread (messages + system activity)
- Skip / mark delivered
- Simple inventory counts per org
- Manual settlement field on the agreement (Stripe later)

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `pnpm dev`     | Dev server         |
| `pnpm db:push` | Sync Prisma schema |
| `pnpm db:seed` | Reset demo data    |
| `pnpm build`   | Production build   |
