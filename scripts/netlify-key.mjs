// Stores the Firebase service-account key on the linked Netlify site, without printing it.
// Usage: npm run netlify:key -- path/to/service-account.json
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

const path = process.argv[2]
if (!path) {
  console.error("Usage: npm run netlify:key -- path/to/service-account.json")
  process.exit(1)
}

const text = readFileSync(path, "utf8")
const key = JSON.parse(text)
if (key.type !== "service_account" || !key.project_id || !key.client_email || !key.private_key) {
  console.error("That file is not a Firebase service-account key.")
  process.exit(1)
}

const value = Buffer.from(JSON.stringify(key)).toString("base64")
const result = spawnSync("npx", ["netlify-cli", "env:set", "FIREBASE_SERVICE_ACCOUNT", value], {
  // Inherited output could echo the value, so only failures are reported.
  stdio: ["inherit", "ignore", "ignore"],
  shell: process.platform === "win32",
})

if (result.status !== 0) {
  console.error("Netlify refused it. Run `npx netlify-cli login` and `npx netlify-cli link` first.")
  process.exit(1)
}
console.log(`Key for ${key.project_id} saved on the Netlify site. Deploy again for it to take effect.`)
