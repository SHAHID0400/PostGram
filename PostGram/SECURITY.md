# Security & production hardening

PostGram is a static Vite SPA backed by Appwrite. Anything that can be enforced
in the repository is listed first; platform settings that live outside the code
follow after it.

## Enforced in this repository

- **Boundary sanitisation** — every caption, comment, message, name, username
  and bio is normalised in `src/lib/security.js` before it reaches Appwrite.
  Markup is stripped at the boundary rather than trusted at render time.
- **Upload validation** — `assertSafeImage` accepts only JPEG, PNG, WEBP and GIF,
  rejects empty files and enforces size limits before an upload starts.
- **Safe error copy** — `src/lib/errors.js` maps HTTP status codes to human
  messages and filters SDK/stack detail. Components never render raw Appwrite
  errors.
- **Error boundaries** — `src/components/system/ErrorBoundary.jsx` wraps the
  router so a render failure cannot blank the app.
- **Security headers** — `vercel.json` sets CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy and
  Cross-Origin-Opener-Policy. HTML is revalidated; hashed assets are immutable.
- **No source maps, no console in production** — `vite.config.js` sets
  `sourcemap: false` and drops `console`/`debugger` in production builds.
- **Code splitting** — every route is lazy-loaded; vendor chunks are split for
  React, Redux, Framer Motion and Appwrite.
- **Health endpoint** — `GET /api/health` reports uptime, memory and Appwrite
  reachability for uptime monitors.
- **Environment hygiene** — `.env.example` documents required variables and
  `.gitignore` excludes local env files. Only public identifiers belong in
  `VITE_` variables; every `VITE_` value ships to the browser.

## Requires platform configuration

These controls cannot be implemented inside a static client bundle. They belong
to Appwrite Console, Vercel or a proxy/WAF in front of them.

### Appwrite Console

1. **Allowed platforms / CORS** — add only the production and preview domains
   under *Project → Platforms*. Remove wildcard or `localhost` entries from the
   production project. Appwrite rejects cross-origin calls from unlisted
   origins.
2. **Auth limits** — under *Auth → Security*, set a minimum password length,
   enable email verification where required and cap session length. Appwrite
   Cloud's abuse protection applies per project.
3. **Collection permissions** — posts: public read, authenticated create,
   author-only update/delete. profiles: public read, owner write. follows and
   messages: authenticated read/create with owner-scoped updates/deletes.
   Never grant `Role.any()` write access.
4. **Storage permissions** — uploads scoped to authenticated users; file
   deletion restricted to the owner.
5. **API keys** — server API keys must never be added to `VITE_` variables. The
   browser only uses the public project ID and session cookies managed by the
   Appwrite SDK.

### Vercel

1. Set the same `VITE_APPWRITE_*` values in *Project → Settings → Environment
   Variables* for production and preview.
2. Enable Vercel Firewall / WAF rate limiting on `/api/*` and auth-adjacent
   paths. A static SPA cannot rate-limit its own requests.
3. Keep the CSP in `vercel.json` in sync with the Appwrite endpoint. If you
   self-host Appwrite on a custom domain, add that origin to `img-src`,
   `media-src` and `connect-src`.

### Rate limiting and cookies — known limits

- **Rate limiting** for registration, uploads and messaging must be enforced by
  Appwrite's own abuse protection or a WAF/CDN rule. Client-side throttling is
  cosmetic and can be bypassed.
- **HttpOnly / SameSite cookies** cannot be set by a browser-only SPA. Appwrite
  manages its session token in the client SDK; moving it to an HttpOnly cookie
  requires a server-side proxy or SSR layer. Until then, the effective controls
  are short session lifetimes, HTTPS-only delivery (HSTS is enabled) and a
  strict CSP.
- **Dependency audit** — run `npm audit` locally or in CI. It was not run as
  part of this change set.
