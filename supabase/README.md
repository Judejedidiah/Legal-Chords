# Admin login security — deployment checklist

The brute-force protection for the admin login is made of three parts:

| Part | File | Purpose |
| --- | --- | --- |
| Database store | `migrations/008_admin_login_rate_limit.sql` | Failed-attempt and block tables, indexes, cleanup helper, RLS |
| Server-side login | `functions/admin-login/index.ts` | Account allowlist, IP/email rate limiting, 15-minute window, 30-minute block, generic errors, block logging |
| Browser wiring | `../js/admin-auth.js`, `../js/config.js` | Sends credentials to the Edge Function and honours `429 / Retry-After` |

The admin dashboard is `../law/index.html`.

## 1. Apply the migration

Run `migrations/008_admin_login_rate_limit.sql` in the Supabase SQL Editor (it is idempotent), or with the CLI:

```bash
supabase db push
```

## 2. Deploy the Edge Function

```bash
supabase functions deploy admin-login
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase. The function takes no other secrets.

## 3. Verify

The function must answer to `OPTIONS` with `200 ok` and reject non-`POST` requests with `400`. The gateway verifies JWTs by default, so authenticated probes need the anon key in an `Authorization: Bearer` header as well as `apikey`:

```bash
curl -i -X OPTIONS https://<PROJECT_ID>.supabase.co/functions/v1/admin-login
curl -i https://<PROJECT_ID>.supabase.co/functions/v1/admin-login \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```

`js/admin-auth.js` sends both headers. If you turn off "Verify JWT" for this function in the dashboard, the `Authorization` header is harmless and can stay.

A `404 NOT_FOUND` means the function has **not** been deployed — the browser is already calling it, so admin login will fail until it is deployed.

## 4. Harden the account itself

- The admin password lives in Supabase Auth, not in this repo. Rotate it in the Supabase dashboard if it has ever been committed to source.
- Confirm the admin user has `app_metadata` = `{"role":"admin"}` (required by migration 006's RLS policies).
- Tune `MAX_ATTEMPTS`, `WINDOW_MINUTES` and `BLOCK_MINUTES` at the top of `functions/admin-login/index.ts` if needed, then redeploy.
