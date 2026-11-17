import { betterAuth } from "better-auth";
import { electron } from "@better-auth/electron";

export const auth = betterAuth({
  plugins: electron(),
  emailAndPassword: true,
});
