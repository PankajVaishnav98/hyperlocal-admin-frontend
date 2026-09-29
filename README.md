# ApnaMart Admin

React operations console for ApnaMart. Operators sign in with
server-enforced credentials, then manage the platform catalog and service
areas. There is no shop-owner login and no online payment flow.

## Stack

- React, TypeScript, and Vite
- React Router with session-aware route guards
- Axios with credentials, HttpOnly cookie sessions, a 10-second timeout,
  normalized errors, and a `401` refresh/session seam
- TanStack Query for server state
- Tailwind CSS with CSS design tokens and reusable interface primitives
- Zod for form validation
- Vitest and Testing Library

## Setup

Requirements: Node.js 22 or a current compatible LTS release and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`VITE_API_URL` is the only client environment variable and is public at build
time. It must never contain secrets.

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

Local development defaults to that value. Production builds use same-origin
`/api/v1` unless overridden. The backend `ADMIN_URL` must match this origin
(`http://localhost:5173` for Vite).

## First admin (development)

The admin app cannot create the first operator. On the backend, in development
or test only:

```bash
ADMIN_BOOTSTRAP_EMAIL=ops@localhost.dev \
ADMIN_BOOTSTRAP_PASSWORD='a-long-local-password1' \
ADMIN_BOOTSTRAP_DISPLAY_NAME='Platform admin' \
npm run db:seed:admin:dev
```

Then sign in with that email and password. The backend stores Argon2id hashes
and sets HttpOnly `hl_admin_access` / `hl_admin_refresh` cookies for this origin.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

## Routes

- `/login` — operator sign-in
- `/` — overview
- `/categories`, `/categories/new`, `/categories/:categoryId`
- `/products`, `/products/new`, `/products/:productId`
- `/service-areas`, `/service-areas/new`, `/service-areas/:serviceAreaId`
- `/orders` — honest empty state until the order domain exists
- `/sessions` — list and revoke operator refresh sessions
- `/orders`, `/orders/:orderId` — cash-on-delivery inbox

Frontend guards only improve navigation. The API enforces the admin role on
every mutation.

## Limitations

- Banners, customers, delivery people, and live GPS tracking are not in this release.
- Product images are not uploaded; object storage is still later work.
- Delete in the UI disables records so historical references stay intact.
