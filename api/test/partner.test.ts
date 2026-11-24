import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { isCmtId } from "@carmitra/shared"

import { adminAuth, ownerVehicles, owners, partnerRefs, partners, privateRef, vehicles } from "../src/firebase"
import { call, car, createPartner, MOBILE, ownerBody, ownerWithVehicle, partnerCar, partnerConsent, resetEmulators, signIn, startServer, stopServer } from "./helpers"

let apiKey: string

beforeAll(startServer)
afterAll(stopServer)
beforeEach(async () => {
  await resetEmulators()
  apiKey = await createPartner()
})

const addVehicle = (body: object = {}, key = apiKey) =>
  call("/partner/vehicles", { apiKey: key, body: { mobile: "9876543210", vehicle: partnerCar, consent: partnerConsent, ...body } })

describe("partner keys", () => {
  it("refuses a missing, wrong or switched-off key", async () => {
    expect((await call("/partner/owners/9876543210/vehicles")).json.error.code).toBe("invalid_api_key")
    expect((await call("/partner/owners/9876543210/vehicles", { apiKey: "csk_tommyandfurry_wrong" })).status).toBe(401)
    expect((await call("/partner/owners/9876543210/vehicles", { apiKey: apiKey.replace("csk_", "psk_") })).status).toBe(401)
    await partners.doc("tommyandfurry").update({ active: false })
    expect((await call("/partner/owners/9876543210/vehicles", { apiKey })).status).toBe(401)
  })

  it("answers an unknown partner address with 404, not a sign-in error", async () => {
    const { status, json } = await call("/partner/nothing-here", { apiKey })
    expect(status).toBe(404)
    expect(json.error.code).toBe("not_found")
  })
})

describe("creating a user from a partner", () => {
  it("creates the account with no OTP, holding only the number, and tags the owner", async () => {
    const { status, json } = await call("/partner/owners", { apiKey, body: { mobile: "9876543210", owner: { name: "Asha Rao", city: "Pune" }, consent: partnerConsent } })
    expect(status).toBe(201)
    expect(json).toEqual({ mobile: MOBILE, isNewUser: true, created: true })

    const user = await adminAuth.getUserByPhoneNumber(MOBILE)
    expect(user.providerData.map((p) => p.providerId)).toEqual(["phone"])
    const owner = (await owners.doc(user.uid).get()).data()!
    expect(owner).toMatchObject({ mobile: MOBILE, name: "Asha Rao", city: "Pune", mobileVerified: true, source: "tommyandfurry" })
    expect(owner.consent).toEqual({ ...partnerConsent, via: "tommyandfurry" })
  })

  it("uses the account that already has this number, and keeps what the owner wrote", async () => {
    await ownerWithVehicle("owner-1", MOBILE)
    const { status, json } = await call("/partner/owners", { apiKey, body: { mobile: "+91 98765 43210", owner: { name: "Someone Else" }, consent: partnerConsent } })
    expect(status).toBe(200)
    expect(json).toEqual({ mobile: MOBILE, isNewUser: false, created: false })
    // Who brought the customer first stays as it was.
    expect((await owners.doc("owner-1").get()).data()).toMatchObject({ name: ownerBody.name, city: ownerBody.city, source: "direct" })
  })

  it("lets the customer sign in later with that mobile and find their details", async () => {
    await call("/partner/owners", { apiKey, body: { mobile: "9876543210", owner: { name: "Asha Rao", city: "Pune" }, consent: partnerConsent } })
    const uid = (await adminAuth.getUserByPhoneNumber(MOBILE)).uid
    const token = await signIn(uid, MOBILE)
    const { json } = await call("/me", { token })
    expect(json.owner).toMatchObject({ name: "Asha Rao", mobileVerified: true })

    await call("/me", { token, method: "PUT", body: { ...ownerBody, name: "Asha R" } })
    expect((await owners.doc(uid).get()).data()).toMatchObject({ name: "Asha R", source: "tommyandfurry" })
  })

  it("refuses a number that isn't an Indian mobile, and a missing consent", async () => {
    const bad = await call("/partner/owners", { apiKey, body: { mobile: "12345", consent: partnerConsent } })
    expect(bad.status).toBe(400)
    expect(bad.json.error.fields).toHaveProperty("mobile")
    expect((await call("/partner/owners", { apiKey, body: { mobile: "9876543210" } })).json.error.fields).toHaveProperty("consent")
  })
})

describe("adding a vehicle from a partner", () => {
  it("creates the user, the owner and the vehicle with its QR link, tagged with the partner", async () => {
    const { status, json } = await addVehicle({ partnerRef: "MOTOR-1", owner: { name: "Asha Rao", city: "Pune" } })
    expect(status).toBe(201)
    expect(isCmtId(json.cmtId)).toBe(true)
    expect(json).toEqual({ cmtId: json.cmtId, scanUrl: `https://carmitra.test/v/${json.cmtId}`, isNewUser: true, created: true })

    const uid = (await adminAuth.getUserByPhoneNumber(MOBILE)).uid
    const profile = (await vehicles.doc(json.cmtId).get()).data()!
    expect(profile).toMatchObject({ type: "car", model: "Honda City", colour: "White", plateMasked: "MH •• 1234", contactMode: "chat", contact: null })
    expect(profile).not.toHaveProperty("ownerUid")
    expect((await privateRef(json.cmtId).get()).data()).toMatchObject({ ownerUid: uid, plate: "MH12AB1234", source: "tommyandfurry", partnerRef: "MOTOR-1", numberConsentAt: null })
    expect((await ownerVehicles(uid).doc(json.cmtId).get()).data()).toMatchObject({ plate: "MH12AB1234" })
    expect((await owners.doc(uid).get()).data()).toMatchObject({ source: "tommyandfurry", name: "Asha Rao" })
  })

  it("shows the number on the scan page only with consent to show it", async () => {
    const { json } = await addVehicle({ owner: { name: "Asha Rao" }, consent: { ...partnerConsent, showNumber: true } })
    expect((await vehicles.doc(json.cmtId).get()).data()).toMatchObject({ contactMode: "number", contact: { name: "Asha", phone: MOBILE } })
    expect((await privateRef(json.cmtId).get()).data()!.numberConsentAt).not.toBeNull()
  })

  it("accepts a colour it doesn't know and a long model name, rather than failing the journey", async () => {
    const { json } = await addVehicle({ vehicle: { type: "bike", plate: "22 BH 1234 AA", model: "Royal Enfield Classic 350 Signals Edition Dual Channel ABS", colour: "Pearl Metallic Gunmetal" } })
    const profile = (await vehicles.doc(json.cmtId).get()).data()!
    expect(profile).toMatchObject({ type: "bike", colour: "", plateMasked: "BH •• 1234" })
    expect(profile.model).toHaveLength(40)
  })

  it("returns the same vehicle when the same application is sent again", async () => {
    const first = await addVehicle({ partnerRef: "MOTOR-1" })
    const second = await addVehicle({ partnerRef: "MOTOR-1" })
    expect(second.status).toBe(200)
    expect(second.json).toMatchObject({ cmtId: first.json.cmtId, isNewUser: false, created: false })
    expect((await vehicles.get()).size).toBe(1)
  })

  it("refuses a partnerRef already used for another customer", async () => {
    await addVehicle({ partnerRef: "MOTOR-1" })
    const { status, json } = await addVehicle({ partnerRef: "MOTOR-1", mobile: "9876500000", vehicle: { ...partnerCar, plate: "MH 12 CD 5678" } })
    expect(status).toBe(409)
    expect(json.error.code).toBe("ref_conflict")
  })

  it("keeps partner references apart between partners", async () => {
    const other = await createPartner("other-partner", "Other")
    await addVehicle({ partnerRef: "MOTOR-1" })
    await addVehicle({ partnerRef: "MOTOR-1", vehicle: { ...partnerCar, plate: "MH 12 CD 5678" } }, other)
    expect((await vehicles.get()).size).toBe(2)
    expect((await partnerRefs.get()).size).toBe(2)
  })

  it("returns the vehicle already on the account when the plate matches, such as at renewal", async () => {
    const { cmtId } = await ownerWithVehicle("owner-1", MOBILE)
    const { status, json } = await addVehicle({ partnerRef: "MOTOR-2027" })
    expect(status).toBe(200)
    expect(json).toMatchObject({ cmtId, created: false })
    // The owner's own vehicle stays theirs, untagged.
    expect((await privateRef(cmtId).get()).data()!.source).toBe("direct")
    expect((await addVehicle({ partnerRef: "MOTOR-2027" })).json.cmtId).toBe(cmtId)
  })

  it("issues a new vehicle when the one an application made has since been removed", async () => {
    const first = await addVehicle({ partnerRef: "MOTOR-1" })
    const uid = (await adminAuth.getUserByPhoneNumber(MOBILE)).uid
    await call(`/vehicles/${first.json.cmtId}`, { token: await signIn(uid, MOBILE), method: "DELETE" })
    const again = await addVehicle({ partnerRef: "MOTOR-1" })
    expect(again.status).toBe(201)
    expect(again.json.cmtId).not.toBe(first.json.cmtId)
  })

  it("explains a bad plate or vehicle type", async () => {
    const { status, json } = await addVehicle({ vehicle: { type: "lorry", plate: "hello" } })
    expect(status).toBe(400)
    expect(Object.keys(json.error.fields)).toEqual(expect.arrayContaining(["vehicle.type", "vehicle.plate"]))
  })
})

describe("reading vehicles as a partner", () => {
  it("lists the vehicles on a mobile, and nothing for a number we don't know", async () => {
    const { json: made } = await addVehicle()
    await ownerWithVehicle("owner-2", null, { ...car, plate: "KA 01 AB 1111" })
    const { json } = await call("/partner/owners/9876543210/vehicles", { apiKey })
    expect(json.vehicles).toEqual([
      expect.objectContaining({ cmtId: made.cmtId, scanUrl: `https://carmitra.test/v/${made.cmtId}`, type: "car", plate: "MH12AB1234", plateMasked: "MH •• 1234", contactMode: "chat" }),
    ])
    expect((await call("/partner/owners/9000000000/vehicles", { apiKey })).json).toEqual({ vehicles: [] })
  })

  it("reads one vehicle for its owner's mobile only", async () => {
    const { json: made } = await addVehicle()
    const mine = await call(`/partner/vehicles/${made.cmtId}?mobile=9876543210`, { apiKey })
    expect(mine.json).toMatchObject({ cmtId: made.cmtId, model: "Honda City" })

    await signIn("someone-else", "+919876500000")
    const other = await call(`/partner/vehicles/${made.cmtId}?mobile=9876500000`, { apiKey })
    expect(other.status).toBe(403)
    expect(other.json.error.code).toBe("mobile_mismatch")
    expect((await call("/partner/vehicles/CMT-2222-22?mobile=9876543210", { apiKey })).status).toBe(404)
  })
})
