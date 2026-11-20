import { vehicleLabel, type CarScan, type CarTag } from "@carmitra/shared"

import { sha256 } from "../auth"
import { db, expireAt, nowIso, scans, tags, throttle } from "../firebase"
import { notFound } from "../http"
import { readVehicle } from "./vehicles"

const THROTTLE_MS = 10 * 60 * 1000

type RecordScan = { cmtId: string; via: "id" | "tag"; tagCode?: string; ip: string }

/**
 * Records that someone opened a vehicle's page. It sends no alert: a scan on its own may be
 * curiosity. The owner is alerted when the person sends a message. One scan per vehicle per
 * IP address every 10 minutes; a repeat gets the same scan back.
 */
export async function recordScan({ cmtId, via, tagCode, ip }: RecordScan): Promise<{ scanId: string; recorded: boolean }> {
  const vehicle = await readVehicle(cmtId)
  if (!vehicle) throw notFound("That vehicle")

  let viaTag: string | null = null
  if (via === "tag" && tagCode) {
    const tag = (await tags.doc(tagCode).get()).data() as CarTag | undefined
    if (tag?.cmtId === cmtId) viaTag = tagCode
  }

  const throttleRef = throttle.doc(sha256(`scan|${ip}|${cmtId}`))
  return db.runTransaction(async (tx) => {
    const held = (await tx.get(throttleRef)).data()
    if (held && held.until > Date.now()) return { scanId: held.scanId as string, recorded: false }

    const ref = scans.doc()
    const scan: CarScan = {
      id: ref.id,
      cmtId,
      plateMasked: vehicle.profile.plateMasked,
      vehicleLabel: vehicleLabel(vehicle.profile),
      ownerUid: vehicle.details.ownerUid,
      via: viaTag ? "tag" : "id",
      tagCode: viaTag,
      read: false,
      createdAt: nowIso(),
    }
    tx.create(ref, scan)
    tx.set(throttleRef, { scanId: ref.id, until: Date.now() + THROTTLE_MS, expireAt: expireAt(Date.now(), 1) })
    return { scanId: ref.id, recorded: true }
  })
}

export async function markScansRead(uid: string) {
  const snap = await scans.where("ownerUid", "==", uid).where("read", "==", false).get()
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch()
    for (const doc of snap.docs.slice(i, i + 400)) batch.update(doc.ref, { read: true })
    await batch.commit()
  }
  return snap.size
}
