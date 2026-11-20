# Payroll Activation App

React, Vite, and Electron app for activating a payroll product key.

## Development

From this directory, install dependencies with Bun if needed, then start the
Electron app:

```sh
bun install
bun run dev
```

Vite runs at `http://localhost:5173`. In development, the Electron window loads
that URL.

## Activation flow

The root route (`/`) asks for an activation key in the `xxx-xxx-xxx` format.
The app trims and lowercases the value, validates its format, and sends it as
JSON to:

```text
POST https://system-payroll-api.automation-payroll.workers.dev/api/key-products/activate
{ "key": "xxx-xxx-xxx" }
```

On successful activation, the app navigates to `/register` and passes the
normalized key in React Router navigation state rather than putting it in the
URL. Registration submits the key together with the user's name, email, and
password to:

```text
POST https://system-payroll-api.automation-payroll.workers.dev/api/key-products/register-admin
```

The backend is responsible for linking the activated key to the new admin
account and marking it redeemed. The registration endpoint is not live until
the backend migration and deployment are complete.

## Authentication client

`src/auth-client.js` uses Better Auth's React client and exports the sign-in,
sign-up, sign-out, session, and session-fetch helpers. It includes cookies and
reads the optional Bearer token from local storage under
`payroll_auth_token`.

In development, auth requests use the local Vite origin and are proxied from
`/api/auth` to the payroll API. Set `VITE_API_URL` to override the auth base URL.
Production defaults to the payroll API origin.

## Electron DevTools

In development builds:

- Press **F12** or **Ctrl+Shift+I** to open DevTools (use **Option+Shift+I** on
  macOS).
- Right-click and select **Inspect Element** to inspect an element.

These shortcuts and the inspect context-menu item are enabled only in
development.

## Build and lint

```sh
bun run build
bun run lint
```
