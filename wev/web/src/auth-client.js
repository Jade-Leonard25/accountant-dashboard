import { createAuthClient } from "better-auth/react";

export const AUTH_TOKEN_KEY = "payroll_auth_token";

const productionAuthURL =
  "https://system-payroll-api.automation-payroll.workers.dev";

export const authBaseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV && typeof window !== "undefined"
    ? window.location.origin
    : productionAuthURL);

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: {
    credentials: "include",
    auth: {
      type: "Bearer",
      token: () =>
        typeof localStorage !== "undefined"
          ? (localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined)
          : undefined,
    },
  },
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
