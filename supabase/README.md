# Supabase setup & admin login security

The brute-force protection for the admin login is made of three parts:

| Part | File | Purpose |
| --- | --- | --- |
| Database store | `migrations/008_admin_login_rate_limit.sql` | Failed-attempt and block tables, indexes, cleanup helper, RLS |
| Server-side login | `functions/admin-login/index.ts` | Account allowlist, IP/email rate limiting, 15-minute window, 30-minute block, generic errors, block logging |
| Browser wiring | `../js/admin-auth.js`, `../js/config.js` | Sends credentials to the Edge Function with the publishable key and honours `429 / Retry-After` |

The admin dashboard is `../law/index.html`.

## API keys — where each value goes

Get both new keys in the Dashboard under **Settings → API Keys → Publishable and secret API keys** (use **Create new API keys** if the project is still on legacy keys only).

| Key | Where it goes | Notes |
| --- | --- | --- |
| Publishable key (`sb_publishable_...`) | `../js/config.js` → `publishableKey`, and GitHub Actions secret `SUPABASE_PUBLISHABLE_KEY` | Public by design; safe in source and CI. |
| Secret key (`sb_secret_...`) | Nowhere in this repo | Injected into Edge Functions as `SUPABASE_SECRET_KEYS` / `SUPABASE_SECRET_KEY`; never paste it into browser code, chat, or Git. |
| Project URL | `../js/config.js` → `url` / `adminLoginFunctionUrl`, and GitHub Actions secret `SUPABASE_URL` | `https://<PROJECT_ID>.supabase.co`. |

Legacy `anon` / `service_role` keys keep working until you disable them in **Settings → API Keys**. Disable them only after the steps below are verified.

## 1. Apply the migration

Run `migrations/008_admin_login_rate_limit.sql` in the Supabase SQL Editor (it is idempotent), or with the CLI:

```bash
supabase db push
```

## 2. Deploy the Edge Function

```bash
supabase functions deploy admin-login
```

The function uses `@supabase/server` with `auth: 'publishable'`. It reads the project's default publishable key to validate the caller and the default secret key for privileged database access. Both are injected automatically via `SUPABASE_PUBLISHABLE_KEYS` and `SUPABASE_SECRET_KEYS` — the function takes no other secrets and contains no key values.

`verify_jwt` must be **off** for this function: it is set in `config.toml`, or toggle "Verify JWT" off in **Dashboard → Edge Functions → admin-login → Details** if deploying from the Dashboard. The SDK performs the key check in-code.

## 3. Verify

The function must answer to `OPTIONS` with `200 ok`, reject non-`POST` requests with `400`, and reject a missing/wrong publishable key with `401` from `@supabase/server`.

```bash
curl -i -X OPTIONS https://<PROJECT_ID>.supabase.co/functions/v1/admin-login

# A probe with a disallowed email should be rejected by the app (401),
# proving the publishable key passed the gateway and the handler ran.
curl -i -X POST https://<PROJECT_ID>.supabase.co/functions/v1/admin-login \
  -H "apikey: <PUBLISHABLE_KEY>" -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"probe"}'
```

`js/admin-auth.js` sends the publishable key on the `apikey` header only. New-format keys are **not** JWTs, so they must not be sent as `Authorization: Bearer <key>`. A `404 NOT_FOUND` means the function has **not** been deployed — admin login will fail until it is deployed.

Keep-alive: in GitHub → Settings → Secrets and variables → Actions, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The old `SUPABASE_KEY` secret is no longer used and can be removed.

## 4. Harden the account itself

- The admin password lives in Supabase Auth, not in this repo. Rotate it in the Supabase dashboard if it has ever been committed to source.
- Confirm the admin user has `app_metadata` = `{"role":"admin"}` (required by migration 006's RLS policies).
- Tune `MAX_ATTEMPTS`, `WINDOW_MINUTES` and `BLOCK_MINUTES` at the top of `functions/admin-login/index.ts` if needed, then redeploy.

Migrating Supabase Auth to JWT signing keys is a separate, optional follow-up; this function validates an API key, not the user's session token.
