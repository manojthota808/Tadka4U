# ⚙️ Tadka4U Backend Layer (`src/backend`)

The backend layer encapsulates all server-side logic, server runtimes, database connections, schemas, security middlewares, and SSR error recovery for Tadka4U.

---

## 📁 Directory Structure

```
src/backend/
├── db/                  # Database management & ORM schemas
│   ├── client.server.ts # Privileged server database connection (service-role key)
│   ├── schema.ts        # Drizzle ORM schema & Supabase Database types
│   └── index.ts         # Database barrel export
├── middleware/          # Server request lifecycle & security middlewares
│   └── index.ts         # Middlewares (SSR auth attacher, cron validator, auth check)
├── server-error.ts      # SSR error normalizer for unhandled server crashes
├── README.md            # Backend documentation
└── index.ts             # Centralized barrel export
```

---

## 🚀 Key Modules

### 1. Database Operations (`@/backend/db`)

- `supabaseAdmin`: Privileged database client with service-role permissions. NEVER export or use this on the client side.
- `schema`: Type definitions and Drizzle schemas for database tables (e.g. `watchlist`).

### 2. Middlewares (`@/backend/middleware`)

- `attachSupabaseAuth`: Request middleware that resolves session tokens during SSR and attaches authenticated user context to TanStack Start server functions.
- `createAuthMiddleware`: Validates authorization tokens and extracts JWT claims for protected server functions.
- `verifyCronSecret`: Validates incoming requests against secret cron keys for scheduled jobs.

### 3. Server Error Recovery (`@/backend/server-error`)

- `normalizeCatastrophicSsrResponse`: Catches swallowed SSR exceptions from underlying server frameworks (such as h3/Nitro) and turns them into cleanly rendered error fallback responses.

---

## 🔒 Security Best Practices

1. **Privileged Keys**: Only access `supabaseAdmin` within server functions, API endpoints, or SSR middleware.
2. **Owner-Only Policies**: Keep watchlist data operations restricted by PostgreSQL row-level security (RLS).
