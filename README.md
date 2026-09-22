# Hyperlocal Admin

Production-oriented React foundation for the Hyperlocal administration
workspace. Phase 1 includes the application shell, routing, session contracts,
API/query boundaries, accessible components, and system states. It intentionally
does not include business workflows or mock operational data.

## Stack

- React, TypeScript, and Vite
- React Router with session-aware route guards
- Axios with credentials, a 10-second timeout, normalized errors, in-memory
  access-token support, and a centralized `401` session seam
- TanStack Query for server state and cache lifecycle
- Tailwind CSS with CSS design tokens and reusable interface primitives
- Vitest and Testing Library

## Setup

Requirements: Node.js 22 or a current compatible LTS release and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`VITE_API_URL` is the only client environment variable:

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

All `VITE_*` values are public at build time and must never contain secrets.
Without an override, local development uses the value above and production uses
the same-origin `/api/v1` path.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

The static `dist/` output requires an HTTP host configured with an SPA fallback
to `index.html`. Cache hashed assets immutably and serve `index.html` without a
long-lived cache.

## Authentication boundary

Admin authentication is not implemented by the Phase 1 backend. The sign-in
screen is therefore deliberately unavailable and accepts no demo or production
credentials. The auth provider models `loading`, `anonymous`, and
`authenticated` states; credentials stay in memory, while the API client is
ready for a future Secure, HttpOnly refresh cookie. Route guards improve
navigation only—backend authorization remains mandatory.

Phase 2 will connect the session bootstrap, login, refresh, and logout flows to
server-enforced admin identity endpoints. Until then, the dashboard is only
reachable through the authenticated session contract used by future integration
code and automated tests.

## Source layout

```text
src/
  api/                 Axios client and normalized API errors
  components/
    states/            Loading, error, and empty states
    ui/                Accessible reusable primitives
  features/auth/       In-memory session state and route guard
  layouts/             Responsive dashboard shell
  pages/               Route-level composition
  routes/              Router definition
  services/            Query client
  utils/               Shared utilities
  app.css              Tailwind theme and CSS design tokens
```

## Phase 1 limitations

- No admin credential endpoint or production login exists yet.
- No catalog, customer, order, fulfillment, delivery, reporting, payment, or
  marketplace workflows are included.
- The dashboard shows implementation readiness only; it contains no fabricated
  business KPIs.
- A future backend must enforce identity, roles, ownership, and authorization;
  frontend guards are not security controls.
