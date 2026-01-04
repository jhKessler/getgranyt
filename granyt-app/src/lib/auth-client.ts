import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Using empty baseURL means requests go to the current origin
  // This enables pre-built Docker images to work on any domain without rebuild
  baseURL: "",
});

export const { signIn, signUp, signOut, useSession } = authClient;
