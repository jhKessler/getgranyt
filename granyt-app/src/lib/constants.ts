import { env } from "@/env";

export const GITHUB_URL = env.NEXT_PUBLIC_GITHUB_URL
export const CONTACT_EMAIL = env.NEXT_PUBLIC_CONTACT_EMAIL

export const INSTALL_COMMAND = env.NEXT_PUBLIC_INSTALL_URL
  ? `curl -fsSL ${env.NEXT_PUBLIC_INSTALL_URL} | sh`
  : "curl -fsSL https://granyt.dev/install.sh | sh"
