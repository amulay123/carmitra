/** Sample pre-printed stickers and a partner for the local emulators. Refuses to run against anything else. */
import { sha256 } from "../api/src/auth"
import { nowIso, partners, tags } from "../api/src/firebase"

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("This script only runs against the emulators.")
  process.exit(1)
}

// Works only on the emulators, where this script runs.
const DEV_KEY = "csk_tommyandfurry_dev-key-for-local-testing-only"
await partners.doc("tommyandfurry").set({ name: "TommyAndFurry", keyHash: sha256(DEV_KEY), active: true })
console.log(`Partner API key for local testing: ${DEV_KEY}`)

const codes = ["CT-7K2M-94XQ", "CT-8H3N-52WR"]
for (const code of codes) {
  await tags.doc(code).set({ code, claimed: false, cmtId: null, batch: "local", createdAt: nowIso() })
}
console.log(`Seeded stickers: ${codes.map((code) => `http://127.0.0.1:5174/t/${code}`).join("  ")}`)
console.log("Mobile sign-in sends no SMS here. Read the code from http://127.0.0.1:9098/emulator/v1/projects/demo-carmitra/verificationCodes")
process.exit(0)
