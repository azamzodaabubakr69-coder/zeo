# Zekron Agent Backend (PHP)

Self-contained PHP 8.1+ backend that powers `agent.zekron.codes`. No Composer
dependencies — only PHP, the `pdo_mysql`, `curl`, `openssl` and `json` extensions.

## Layout

```
backend/
├── public/
│   ├── index.php       <- front controller (set this as DocumentRoot)
│   └── .htaccess
├── src/
│   ├── bootstrap.php
│   ├── routes.php
│   ├── Controllers/
│   ├── Services/
│   ├── Database/
│   ├── Http/
│   ├── Security/
│   └── Support/
├── .htaccess
├── .env.example
└── schema.sql
```

## Deploying to your own server (e.g. cPanel / VPS / Plesk)

1. Upload the `backend/` folder to the server (e.g. `/home/zekron/agent.zekron.codes/`).
2. Point the **DocumentRoot** of the `agent.zekron.codes` virtual host at
   `backend/public/`. If you can't, the root `.htaccess` will redirect requests
   into `public/` automatically.
3. Make sure `mod_rewrite` is enabled and `AllowOverride All` is set for the
   directory.
4. Create a MySQL database and a user with full privileges on it.
5. Import `schema.sql`:
   ```bash
   mysql -u USER -p DBNAME < schema.sql
   ```
6. Copy `.env.example` to `.env` and fill in:
   - `DB_*` credentials
   - `JWT_SECRET` and `APP_KEY` — long random strings
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`
   - `FRONTEND_URL` (e.g. `https://zekron.codes`)
   - `CORS_ALLOWED_ORIGINS` (comma separated list of frontend origins)
7. Confirm the API is up:
   ```
   GET https://agent.zekron.codes/api/health  ->  {"ok":true}
   ```
8. Sign in to the admin account (email `admin@zekron.codes` / password
   `ChangeMe!2024`), then immediately change the password and add at least one
   active API key under **Admin -> API Keys**.

## Default admin

The seed inserts a default admin user:

- email: `admin@zekron.codes`
- password: `ChangeMe!2024`

Change it after first login. Any user with `is_admin = 1` in the `users` table
becomes an administrator.

## Endpoints (summary)

```
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/logout
GET   /api/auth/me
GET   /api/auth/google
GET   /api/auth/google/callback

GET   /api/models
POST  /api/chat
GET   /api/chats           POST /api/chats
GET   /api/chats/{id}      DELETE /api/chats/{id}
GET   /api/billing/me

GET   /api/admin/stats
GET   /api/admin/users     PATCH/DELETE /api/admin/users/{id}
GET   /api/admin/models    POST/PATCH/DELETE /api/admin/models[/{id}]
GET   /api/admin/api-keys  POST/PATCH/DELETE /api/admin/api-keys[/{id}]
GET   /api/admin/usage-logs
POST  /api/admin/billing/topup
GET/POST /api/admin/settings
```

## Notes

- Provider API keys are encrypted at rest with AES-256-GCM derived from
  `APP_KEY`. Don't lose `APP_KEY` or you'll have to re-enter all keys.
- JWT lifetime is controlled by `JWT_TTL_HOURS` (default 720h / 30 days).
- The `/api/chat` endpoint is **non-streaming** JSON. The frontend renders
  Markdown after the response is complete.
