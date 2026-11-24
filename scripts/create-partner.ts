/**
 * Creates a partner and prints its API key. The key is shown once: only its hash is stored.
 *
 *   npm run partner:create -- tommyandfurry "TommyAndFurry"
 *   npm run partner:create -- tommyandfurry "TommyAndFurry" --rotate
 *
 * Runs against the project in api/.env (GOOGLE_APPLICATION_CREDENTIALS), like tags:create.
 */
import { newPartnerKey, sha256 } from "../api/src/auth"
import { config } from "../api/src/config"
import { nowIso, partners } from "../api/src/firebase"

const [id, name, flag] = process.argv.slice(2)
if (!id || !name || !/^[a-z0-9-]+$/.test(id)) {
  console.error('Usage: npm run partner:create -- <id-in-lowercase> "<Display name>" [--rotate]')
  process.exit(1)
}

const ref = partners.doc(id)
if ((await ref.get()).exists && flag !== "--rotate") {
  console.error(`Partner "${id}" already exists. Add --rotate to replace its key.`)
  process.exit(1)
}

const key = newPartnerKey(id)
await ref.set({ name, keyHash: sha256(key), active: true, updatedAt: nowIso() }, { merge: true })
console.log(`Project: ${config.projectId}\nPartner: ${name} (${id})\nAPI key (shown once, keep it secret):\n\n${key}\n`)
process.exit(0)
