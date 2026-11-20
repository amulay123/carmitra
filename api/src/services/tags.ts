import { FieldValue } from "firebase-admin/firestore"

import { isTagCode, type CarTag, type StickerOrderInput, type VehiclePrivate } from "@carmitra/shared"

import { db, nowIso, privateRef, stickerOrders, tags, vehicles } from "../firebase"
import { ApiError, notFound } from "../http"
import { readOwnedVehicle } from "./vehicles"

/** Links a pre-printed sticker to one of the owner's vehicles, or moves it between their own vehicles. */
export async function claimTag(code: string, cmtId: string, uid: string) {
  if (!isTagCode(code)) throw notFound("That sticker")
  await readOwnedVehicle(cmtId, uid)

  await db.runTransaction(async (tx) => {
    const tagRef = tags.doc(code)
    const tag = (await tx.get(tagRef)).data() as CarTag | undefined
    if (!tag) throw notFound("That sticker")

    const previous = tag.claimed && tag.cmtId ? privateRef(tag.cmtId) : null
    if (previous) {
      const holder = (await tx.get(previous)).data() as VehiclePrivate | undefined
      if (holder && holder.ownerUid !== uid) throw new ApiError(409, "tag_taken", "This sticker is already linked to another vehicle.")
      if (tag.cmtId === cmtId) return
      if (holder) tx.update(previous, { tagCodes: FieldValue.arrayRemove(code) })
    }
    tx.update(tagRef, { claimed: true, cmtId })
    tx.update(privateRef(cmtId), { tagCodes: FieldValue.arrayUnion(code) })
    tx.update(vehicles.doc(cmtId), { updatedAt: nowIso() })
  })
}

type OrderInput = Required<StickerOrderInput>

export async function createStickerOrder(uid: string, input: OrderInput) {
  const { details } = await readOwnedVehicle(input.cmtId, uid)
  const ref = stickerOrders.doc()
  await ref.set({ ...input, id: ref.id, ownerUid: uid, plate: details.plate, status: "requested", createdAt: nowIso() })
  return ref.id
}
