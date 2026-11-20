# Login Redirect Issue Report

## Summary

After a successful email sign-in, the app could return the user to the login
page instead of leaving them on the dashboard.

## Cause

The login view called the auth API and saved the returned bearer token in
`localStorage`. The Vue Router guard then checked the session through the
Better Auth client, but that client was not sending the saved token. As a
result, the guard could see the user as unauthenticated and redirect the
dashboard request back to `/login`.

The login view and auth client also selected their API base URLs separately,
which could cause sign-in and session checks to use different origins.

## Resolution

- Shared the auth API base URL between sign-in and the Better Auth client.
- Configured the Better Auth client to read the saved token for requests.
- Kept the protected-route session check in the router; it can now validate
  the same authenticated session established by sign-in.

## Verification

`bun run build` passed, including the Vue TypeScript check and Vite production
build. Vite emitted a non-blocking warning about a JavaScript bundle exceeding
500 kB.
