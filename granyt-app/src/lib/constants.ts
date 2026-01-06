import { env } from "@/env";

export const INSTALL_COMMAND = "curl -fsSL https://granyt.dev/install.sh | sh"
export const GITHUB_URL = env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/jhKessler/getgranyt"
