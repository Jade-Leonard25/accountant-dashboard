import { createAuthClient } from "better-auth/client";
import { electronProxyClient } from "@better-auth/electron/proxy";

export const createClient = createAuthClient({
  baseURL: "http://localhost:8080",
  plugins: [
    electronProxyClient({
      protocol: {
        scheme: ".com",
      },
    }),
  ],
});
