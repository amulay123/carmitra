import type { DocumentReference, Transaction } from "firebase-admin/firestore"

import { generateCmtId, isCmtId, maskPlate, scanPath, vehicleLabel, type CarChat, type CarOwner, type VehicleInput, type VehiclePatch, type VehiclePrivate, type VehicleProfile } from "@carmitra/shared"

import { sha256 } from "../auth"
import { config } from "../config"
import { chats, db, nowIso, ownerVehicles, partnerRefs, privateRef, rooms, tags, vehicles } from "../firebase"
import { ApiError, notFound } from "../http"
import { contactFor } from "./owners"

class IdTaken extends Error {}

type ParsedVehicle = Required<Omit<VehicleInput, "numberConsent">> & { numberConsent: boolean }

async function plateInUse(uid: string, plate: string, except?: string): Promise<boolean> {
  const snap = await ownerVehicles(uid).where("plate", "==", plate).get()
  return snap.docs.some((doc) => doc.id !== except)
}

const plateTaken = () => new ApiError(409, "plate_exists", "This vehicle is already on your account.")

/** An owner adding a vehicle on Carmitra. */
export async function createVehicle(owner: CarOwner, input: ParsedVehicle): Promise<{ cmtId: string }> {
  if (await plateInUse(owner.uid, input.plate)) throw plateTaken()
  const { cmtId } = await issueVehicle(owner, input, { source: "direct" })
  return { cmtId }
}

/**
 * A partner adding a vehicle it has verified the owner of. Sending the same application again
 * returns the same vehicle, and so does a plate already on the owner's account (such as at
 * renewal), so a partner never makes a second ID for one vehicle.
 */
export async function createPartnerVehicle(owner: CarOwner, input: ParsedVehicle, partner: { id: string; ref?: string }): Promise<{ cmtId: string; created: boolean }> {
  const ref = partner.ref ? { doc: partnerRefs.doc(sha256(`${partner.id}:${partner.ref}`)), partnerId: partner.id } : undefined
  const samePlate = (await ownerVehicles(owner.uid).where("plate", "==", input.plate).limit(1).get()).docs[0]?.id
  return issueVehicle(owner, input, { source: partner.id, partnerRef: partner.ref ?? null, ref, samePlate })
}

type Issue = {
  source: string
  partnerRef?: string | null
  /** Where a partner's application reference is recorded. */
  ref?: { doc: DocumentReference; partnerId: string }
  /** A vehicle with this plate already on the account, which a partner gets back instead. */
  samePlate?: string
}

async function issueVehicle(owner: CarOwner, input: ParsedVehicle, issue: Issue): Promise<{ cmtId: string; created: boolean }> {
  const { ref, samePlate } = issue
  const recordRef = (tx: Transaction, cmtId: string) => {
    if (ref) tx.set(ref.doc, { cmtId, ownerUid: owner.uid, partnerId: ref.partnerId, createdAt: nowIso() })
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const cmtId = generateCmtId()
    try {
      return await db.runTransaction(async (tx) => {
        if (ref) {
          const earlier = (await tx.get(ref.doc)).data()
          if (earlier && earlier.ownerUid !== owner.uid) throw new ApiError(409, "ref_conflict", "That partnerRef belongs to a different customer.")
          // The vehicle may have been removed since; then this application gets a new one.
          if (earlier && (await tx.get(vehicles.doc(earlier.cmtId))).exists) return { cmtId: earlier.cmtId as string, created: false }
        }
        if (samePlate && (await tx.get(vehicles.doc(samePlate))).exists) {
          recordRef(tx, samePlate)
          return { cmtId: samePlate, created: false }
        }
        const profileRef = vehicles.doc(cmtId)
        if ((await tx.get(profileRef)).exists) throw new IdTaken()

        const now = nowIso()
        const profile: VehicleProfile = {
          cmtId,
          type: input.type,
          model: input.model,
          colour: input.colour,
          plateMasked: maskPlate(input.plate),
          noteForVisitors: input.noteForVisitors,
          contactMode: input.contactMode,
          contact: contactFor(owner, input.contactMode),
          createdAt: now,
          updatedAt: now,
        }
        const details: VehiclePrivate = {
          ownerUid: owner.uid,
          plate: input.plate,
          tagCodes: [],
          numberConsentAt: input.contactMode === "number" ? now : null,
          source: issue.source,
          partnerRef: issue.partnerRef ?? null,
        }
        tx.create(profileRef, profile)
        tx.create(privateRef(cmtId), details)
        tx.create(ownerVehicles(owner.uid).doc(cmtId), { cmtId, plate: input.plate, createdAt: now })
        recordRef(tx, cmtId)
        return { cmtId, created: true }
      })
    } catch (err) {
      if (!(err instanceof IdTaken)) throw err
    }
  }
  throw new ApiError(503, "id_unavailable", "Couldn't issue an ID. Please try again.")
}

export async function readVehicle(cmtId: string): Promise<{ profile: VehicleProfile; details: VehiclePrivate } | null> {
  if (!isCmtId(cmtId)) return null
  const [profile, details] = await Promise.all([vehicles.doc(cmtId).get(), privateRef(cmtId).get()])
  if (!profile.exists || !details.exists) return null
  return { profile: profile.data() as VehicleProfile, details: details.data() as VehiclePrivate }
}

/** What a partner gets back about a vehicle. The partner has verified the owner's mobile. */
export function partnerVehicleView({ profile, details }: { profile: VehicleProfile; details: VehiclePrivate }) {
  return {
    cmtId: profile.cmtId,
    scanUrl: `${config.publicUrl}${scanPath(profile.cmtId)}`,
    type: profile.type,
    plate: details.plate,
    plateMasked: profile.plateMasked,
    model: profile.model,
    colour: profile.colour,
    contactMode: profile.contactMode,
    createdAt: profile.createdAt,
  }
}

/** Someone else's vehicle looks the same as no vehicle at all. */
export async function readOwnedVehicle(cmtId: string, uid: string) {
  const vehicle = await readVehicle(cmtId)
  if (!vehicle || vehicle.details.ownerUid !== uid) throw notFound("That vehicle")
  return vehicle
}

export async function updateVehicle(cmtId: string, owner: CarOwner, patch: VehiclePatch & { plate?: string }) {
  const { profile, details } = await readOwnedVehicle(cmtId, owner.uid)
  if (patch.plate && patch.plate !== details.plate && (await plateInUse(owner.uid, patch.plate, cmtId))) throw plateTaken()

  const now = nowIso()
  const mode = patch.contactMode ?? profile.contactMode
  const profileUpdate: Partial<VehicleProfile> = { updatedAt: now }
  if (patch.type !== undefined) profileUpdate.type = patch.type
  if (patch.model !== undefined) profileUpdate.model = patch.model
  if (patch.colour !== undefined) profileUpdate.colour = patch.colour
  if (patch.noteForVisitors !== undefined) profileUpdate.noteForVisitors = patch.noteForVisitors
  if (patch.plate !== undefined) profileUpdate.plateMasked = maskPlate(patch.plate)
  if (patch.contactMode !== undefined) {
    profileUpdate.contactMode = mode
    profileUpdate.contact = contactFor(owner, mode)
  }

  const batch = db.batch()
  batch.update(vehicles.doc(cmtId), profileUpdate)
  const privateUpdate: Partial<VehiclePrivate> = {}
  if (patch.plate !== undefined) privateUpdate.plate = patch.plate
  if (patch.contactMode === "number" && profile.contactMode !== "number") privateUpdate.numberConsentAt = now
  if (patch.contactMode === "chat") privateUpdate.numberConsentAt = null
  if (Object.keys(privateUpdate).length) batch.update(privateRef(cmtId), privateUpdate)
  if (patch.plate !== undefined) batch.update(ownerVehicles(owner.uid).doc(cmtId), { plate: patch.plate })
  await batch.commit()

  // Open chats name the vehicle; keep them in step.
  if (patch.plate !== undefined || patch.model !== undefined || patch.colour !== undefined || patch.type !== undefined) {
    const next = { ...profile, ...profileUpdate }
    await renameChats(owner.uid, cmtId, { plateMasked: next.plateMasked, vehicleLabel: vehicleLabel(next) })
  }
}

async function chatsFor(uid: string, cmtId: string): Promise<CarChat[]> {
  // Filtered here: a two-field query would need a new index on WeSafe's project.
  const snap = await chats.where("ownerUid", "==", uid).get()
  return snap.docs.map((doc) => doc.data() as CarChat).filter((chat) => chat.cmtId === cmtId)
}

async function renameChats(uid: string, cmtId: string, names: { plateMasked: string; vehicleLabel: string }) {
  const list = await chatsFor(uid, cmtId)
  for (let i = 0; i < list.length; i += 200) {
    const batch = db.batch()
    for (const chat of list.slice(i, i + 200)) {
      batch.update(chats.doc(chat.chatId), names)
      batch.update(rooms.doc(chat.roomKey), names)
    }
    await batch.commit()
  }
}

/**
 * The vehicle is sold or gone. Its scan page stops working, its pre-printed stickers are freed
 * for whoever has the vehicle next, and its open chats close. Scans already recorded stay in
 * the owner's inbox.
 */
export async function removeVehicle(cmtId: string, uid: string) {
  const { details } = await readOwnedVehicle(cmtId, uid)
  const open = (await chatsFor(uid, cmtId)).filter((chat) => chat.status === "open")

  const batch = db.batch()
  batch.delete(vehicles.doc(cmtId))
  batch.delete(privateRef(cmtId))
  batch.delete(ownerVehicles(uid).doc(cmtId))
  for (const code of details.tagCodes) batch.update(tags.doc(code), { claimed: false, cmtId: null })
  for (const chat of open) {
    batch.update(chats.doc(chat.chatId), { status: "closed" })
    batch.update(rooms.doc(chat.roomKey), { status: "closed" })
  }
  await batch.commit()
}
