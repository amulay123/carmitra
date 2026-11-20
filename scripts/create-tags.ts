/**
 * Creates pre-printed sticker codes and writes a CSV of codes and links for the printer.
 *
 *   npm run tags:create -- 500 batch-2026-12
 */
import { mkdirSync, writeFileSync } from "node:fs"

import { generateTagCode, tagPath } from "@carmitra/shared"

import { config } from "../api/src/config"
import { db, nowIso, tags } from "../api/src/firebase"

const count = Number(process.argv[2])
const batchName = process.argv[3]
if (!Number.isInteger(count) || count < 1 || count > 20_000 || !batchName || !/^[\w-]+$/.test(batchName)) {
  console.error("Usage: npm run tags:create -- <count, up to 20000> <batch-name>")
  process.exit(1)
}

const codes = new Set<string>()
while (codes.size < count) codes.add(generateTagCode())

// create() refuses a code that already exists, so an earlier batch is never overwritten.
const writer = db.bulkWriter()
writer.onWriteError(() => false)
const createdAt = nowIso()
const made: string[] = []
for (const code of codes) {
  writer.create(tags.doc(code), { code, claimed: false, cmtId: null, batch: batchName, createdAt }).then(
    () => made.push(code),
    () => undefined,
  )
}
await writer.close()

mkdirSync("tag-batches", { recursive: true })
const file = `tag-batches/${batchName}.csv`
writeFileSync(file, `code,url\n${made.map((code) => `${code},${config.publicUrl}${tagPath(code)}`).join("\n")}\n`)
console.log(`Created ${made.length} sticker codes in ${config.projectId}. Print file: ${file}`)
process.exit(0)
