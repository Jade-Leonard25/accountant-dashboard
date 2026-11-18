import { createAuthClient } from "better-auth/react";

const usesLocalAuthProxy =
  typeof window !== "undefined" &&
  (window.location.protocol === "electronpayroll:" ||
    ((window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
      window.location.port === "5173"));

const authBaseURL = usesLocalAuthProxy
  ? window.location.origin
  : "https://system-payroll-api.developmentserver160.workers.dev";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession, signIn, signUp, signOut } = authClient;
