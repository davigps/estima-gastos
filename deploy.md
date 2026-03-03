# Deploy on Railway

Step-by-step guide to deploy **Estima Odontologia** on [Railway](https://railway.com) with PostgreSQL.

---

## Prerequisites

- A [Railway account](https://railway.com) (free tier works to start)
- Your code pushed to a GitHub repository

---

## 1. Create a new project on Railway

1. Go to [railway.com/new](https://railway.com/new)
2. Click **"Deploy from GitHub repo"**
3. Select your repository (`estima-gastos`)
4. Railway will create a new project with a service for your app

---

## 2. Add PostgreSQL

1. Inside your project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will provision a Postgres instance automatically

---

## 3. Configure environment variables

Click on your **app service** (not the database) → **"Variables"** tab → add:

| Variable        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`  | Use the **Reference Variable**: `${{Postgres.DATABASE_URL}}`       |
| `AUTH_PASSWORD` | Choose a strong password for login                                 |
| `JWT_SECRET`    | A random string with 32+ characters (use `openssl rand -hex 32`)   |

> **Tip:** Using `${{Postgres.DATABASE_URL}}` as a reference variable makes Railway automatically inject the correct connection string — no manual copy needed.

---

## 4. Configure build & start settings

No custom build/start commands are needed — Railway auto-detects `pnpm build` and `pnpm start` from `package.json`.

### How migrations and seeding work automatically

The `package.json` scripts handle everything automatically:

**Build phase** (no database access):
```
"prebuild": "prisma generate"   ← generates the typed Prisma client
"build":    "next build"        ← builds the Next.js app
```

**Start phase** (database is reachable):
```
"start": "prisma migrate deploy && tsx prisma/seed.ts && next start"
            ↑ applies pending migrations   ↑ seeds categories (upsert = no duplicates)
```

> Railway's build step runs in an isolated container **without network access** to other services, so migrations and seeding must run at start time.

- **`prisma migrate deploy`** — applies pending migrations. If already up-to-date, it's a no-op.
- **`tsx prisma/seed.ts`** — seeds default categories using `upsert`, safe to run on every start.

> Railway auto-detects pnpm from the `pnpm-lock.yaml` file.

---

## 5. Set up a custom domain (optional)

1. Go to your **app service** → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** for a free `*.up.railway.app` domain
3. Or add your own custom domain and configure the DNS CNAME record

---

## 6. Verify the deploy

1. Open the generated URL
2. Log in with the `AUTH_PASSWORD` you configured
3. Check that categories were seeded and the dashboard loads

---

## Redeployments

Every push to your main branch triggers an automatic redeploy. Migrations and seed run automatically via `postbuild` — no manual intervention needed.

---

## Troubleshooting

| Problem                    | Solution                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| Build fails on Prisma      | Ensure `DATABASE_URL` is set and the Postgres service is running       |
| "relation does not exist"  | Check build logs — `prisma migrate deploy` should appear in postbuild  |
| Login doesn't work         | Verify `AUTH_PASSWORD` and `JWT_SECRET` are set in variables           |
| 500 errors on dashboard    | Check build logs for seed output — upserts should run in postbuild     |
| pnpm not found             | Ensure `pnpm-lock.yaml` is committed to the repository                |
