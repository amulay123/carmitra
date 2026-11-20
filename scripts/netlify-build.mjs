// The Netlify build. It stops with a clear message rather than publish a site that can't work.
import { spawnSync } from "node:child_process"

const env = { ...process.env }

// The API is on the same address as the site.
env.VITE_API_URL ||= "/v1"
// The address inside every QR. It follows the site's main Netlify domain unless set on purpose.
env.VITE_PUBLIC_URL ||= process.env.URL ?? ""
env.VITE_WESAFE_URL ||= "https://wesafeqr.com"
env.VITE_PETSAFE_URL ||= "https://petsafe.wesafeqr.com"
env.VITE_TOMMYANDFURRY_URL ||= "https://tommyandfurry.com"

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_PUBLIC_URL",
]
const missing = required.filter((name) => !env[name])

if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")}\nSee "Going live" in README.md.`)
  process.exit(1)
}
if (env.VITE_USE_EMULATORS === "true") {
  console.error("VITE_USE_EMULATORS is on. A published site must use the real Firebase project.")
  process.exit(1)
}

// Builds the API first: netlify/functions/api.mjs publishes the result.
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", env, shell: process.platform === "win32" })
process.exit(build.status ?? 1)
