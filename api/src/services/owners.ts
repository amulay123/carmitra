import type { DecodedIdToken } from "firebase-admin/auth"

import { CONSENT_VERSION, firstName, normalizeMobile, type CarOwner, type ContactMode, type OwnerPrefill, type VehicleProfile } from "@carmitra/shared"

import { db, nowIso, owners, ownerVehicles, vehicles } from "../firebase"
import { ApiError } from "../http"

export async function readOwner(uid: string): Promise<CarOwner | null> {
  const snap = await owners.doc(uid).get()
  return snap.exists ? (snap.data() as CarOwner) : null
}

/** What a scan page shows of the owner: nothing, unless they chose to show their number. */
export function contactFor(owner: CarOwner, mode: ContactMode): VehicleProfile["contact"] {
  return mode === "number" ? { name: firstName(owner.name), phone: owner.mobile } : null
}

export async function ownerVehicleIds(uid: string): Promise<string[]> {
  const snap = await ownerVehicles(uid).get()
  return snap.docs.map((doc) => doc.id)
}

/** Vehicles that show the owner's number carry it, so they follow any change to it. */
async function pushOwnerToVehicles(owner: CarOwner) {
  const ids = await ownerVehicleIds(owner.uid)
  if (!ids.length) return
  const profiles = await db.getAll(...ids.map((id) => vehicles.doc(id)))
  const showing = profiles.filter((snap) => (snap.data() as VehicleProfile | undefined)?.contactMode === "number")
  const updatedAt = nowIso()
  for (let i = 0; i < showing.length; i += 400) {
    const batch = db.batch()
    for (const snap of showing.slice(i, i + 400)) batch.update(snap.ref, { contact: contactFor(owner, "number"), updatedAt })
    await batch.commit()
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "")

/** Read-only looks at the user's WeSafe and PetSafeQR records, to save them typing. */
async function familyPrefill(uid: string): Promise<{ name: string; mobile: string; city: string }> {
  const [children, petOwner] = await Promise.all([db.collection("Users").doc(uid).collection("ChildList").limit(10).get(), db.collection("petOwners").doc(uid).get()])

  const pet = petOwner.data() ?? {}
  const child = children.docs.find((doc) => doc.id === "child1") ?? children.docs[0]
  const info = child ? ((await child.ref.collection("data").doc("personal_information").get()).data() ?? {}) : {}

  return {
    name: text(info.name) || text(child?.data().name) || text(pet.name),
    mobile: normalizeMobile(text(info.phone) || text(info.phoneNumber)) ?? normalizeMobile(text(pet.mobile)) ?? "",
    city: text(info.addressCity) || text(pet.city),
  }
}

export async function prefillFor(user: DecodedIdToken): Promise<OwnerPrefill> {
  const family = await familyPrefill(user.uid)
  const verified = user.phone_number ? normalizeMobile(user.phone_number) : null
  return {
    name: family.name || (typeof user.name === "string" ? user.name : ""),
    mobile: verified ?? family.mobile,
    city: family.city,
    mobileLocked: Boolean(verified),
  }
}

type OwnerUpdate = { name: string; mobile: string; city: string }

/** An owner saving their own details. */
export async function saveOwner(user: DecodedIdToken, input: OwnerUpdate): Promise<CarOwner> {
  const verified = user.phone_number ? normalizeMobile(user.phone_number) : null
  // This number can appear on scan pages and gets the alerts, so someone signed in by mobile can't swap in another.
  if (verified && verified !== input.mobile) {
    throw new ApiError(400, "mobile_mismatch", "Use the mobile number you signed in with.")
  }
  const now = nowIso()
  const existing = await readOwner(user.uid)
  const owner: CarOwner = {
    uid: user.uid,
    mobile: input.mobile,
    name: input.name,
    city: input.city,
    mobileVerified: verified === input.mobile,
    consent: existing?.consent ?? { version: CONSENT_VERSION, at: now },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await owners.doc(user.uid).set(owner)
  await pushOwnerToVehicles(owner)
  return owner
}

/** The number WhatsApp alerts go to. */
export async function ownerMobile(uid: string): Promise<string | null> {
  return ((await owners.doc(uid).get()).data()?.mobile as string | undefined) || null
}
