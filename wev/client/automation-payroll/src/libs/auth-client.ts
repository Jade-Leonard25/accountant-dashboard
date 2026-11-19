import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: "https://system-payroll-api.automation-payroll.workers.dev",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
