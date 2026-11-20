// libs/auth-client.ts
import { createAuthClient } from "better-auth/vue";

export const AUTH_TOKEN_KEY = "payroll_auth_token";

export const authBaseURL =
  import.meta.env.VITE_API_URL ||
  "https://system-payroll-api.automation-payroll.workers.dev";

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

export const { signIn, signOut, useSession, getSession } = authClient;