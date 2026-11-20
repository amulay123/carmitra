import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { chats, ownerVehicles, privateRef, rooms, scans, stickerOrders, tags, throttle, vehicles } from "../src/firebase"
import { addTag, call, car, familyRecords, MOBILE, ownerBody, ownerWithVehicle, resetEmulators, sent, signIn, startServer, stopServer } from "./helpers"

beforeAll(startServer)
afterAll(stopServer)
beforeEach(resetEmulators)

describe("owner details", () => {
  it("requires sign-in", async () => {
    expect((await call("/me")).status).toBe(401)
    expect((await call("/me", { token: "nonsense" })).status).toBe(401)
  })

  it("prefills from the sign-in number and the WeSafe profile, without changing WeSafe", async () => {
    const token = await signIn("owner-1", MOBILE)
    const child = await familyRecords.weSafe("owner-1")
    const { json } = await call("/me", { token })
    expect(json.owner).toBeNull()
    expect(json.prefill).toEqual({ name: "Asha Rao", mobile: MOBILE, city: "Pune", mobileLocked: true })
    expect((await child.get()).data()).toEqual({ name: "Asha" })
  })

  it("prefills from a PetSafeQR owner record when there is no WeSafe profile", async () => {
    const token = await signIn("google-user")
    await familyRecords.petSafe("google-user")
    const { json } = await call("/me", { token })
    expect(json.prefill).toEqual({ name: "Asha P", mobile: "+919111111111", city: "Nashik", mobileLocked: false })
  })

  it("marks a sign-in number verified, refuses a different one, and needs the consent tick", async () => {
    const token = await signIn("owner-1", MOBILE)
    expect((await call("/me", { token, method: "PUT", body: ownerBody })).json.owner.mobileVerified).toBe(true)
    const other = await call("/me", { token, method: "PUT", body: { ...ownerBody, mobile: "9876500001" } })
    expect(other.json.error.code).toBe("mobile_mismatch")
    const noTick = await call("/me", { token, method: "PUT", body: { ...ownerBody, consent: { accepted: false } } })
    expect(noTick.status).toBe(400)
  })

  it("treats a number typed by a Google user as unverified", async () => {
    const token = await signIn("google-user")
    expect((await call("/me", { token, method: "PUT", body: ownerBody })).json.owner.mobileVerified).toBe(false)
  })

  it("updates the number on vehicles that show it, and leaves chat-only vehicles alone", async () => {
    const { token, cmtId } = await ownerWithVehicle("owner-1", MOBILE, { ...car, contactMode: "number", numberConsent: true })
    const quiet = await call("/vehicles", { token, body: { ...car, plate: "MH 12 CD 5678" } })
    await call("/me", { token, method: "PUT", body: { ...ownerBody, name: "Meera Rao" } })
    expect((await vehicles.doc(cmtId).get()).data()!.contact).toEqual({ name: "Meera", phone: MOBILE })
    expect((await vehicles.doc(quiet.json.cmtId).get()).data()!.contact).toBeNull()
  })
})

describe("vehicles", () => {
  it("needs owner details before a vehicle", async () => {
    const token = await signIn("owner-1", MOBILE)
    const { status, json } = await call("/vehicles", { token, body: car })
    expect(status).toBe(409)
    expect(json.error.code).toBe("owner_required")
  })

  it("keeps the public record to what a scan may show", async () => {
    const { cmtId } = await ownerWithVehicle()
    expect(cmtId).toMatch(/^CMT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/)
    const profile = (await vehicles.doc(cmtId).get()).data()!
    expect(profile).toMatchObject({ type: "car", model: "Honda City", colour: "White", plateMasked: "MH •• 1234", contactMode: "chat", contact: null })
    expect(JSON.stringify(profile)).not.toContain("MH12AB1234")
    expect(profile).not.toHaveProperty("ownerUid")
    expect((await privateRef(cmtId).get()).data()).toMatchObject({ ownerUid: "owner-1", plate: "MH12AB1234", tagCodes: [], numberConsentAt: null })
    expect((await ownerVehicles("owner-1").doc(cmtId).get()).exists).toBe(true)
  })

  it("shows the number only with the owner's say-so", async () => {
    const token = await signIn("owner-1", MOBILE)
    await call("/me", { token, method: "PUT", body: ownerBody })
    const refused = await call("/vehicles", { token, body: { ...car, contactMode: "number" } })
    expect(refused.status).toBe(400)
    expect(refused.json.error.fields.numberConsent).toBeTruthy()

    const { json } = await call("/vehicles", { token, body: { ...car, contactMode: "number", numberConsent: true } })
    expect((await vehicles.doc(json.cmtId).get()).data()!.contact).toEqual({ name: "Asha", phone: MOBILE })
    expect((await privateRef(json.cmtId).get()).data()!.numberConsentAt).toBeTruthy()
  })

  it("refuses the same plate twice on one account, but not on another", async () => {
    const { token } = await ownerWithVehicle()
    const again = await call("/vehicles", { token, body: { ...car, plate: "mh12ab1234" } })
    expect(again.status).toBe(409)
    expect(again.json.error.code).toBe("plate_exists")
    await expect(ownerWithVehicle("owner-2", null)).resolves.toBeTruthy()
  })

  it("edits details and the contact choice, and hides another owner's vehicle", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    expect((await call(`/vehicles/${cmtId}`, { token, method: "PATCH", body: { plate: "DL 3C AB 4821", colour: "Red", noteForVisitors: "In the office opposite" } })).status).toBe(200)
    expect((await vehicles.doc(cmtId).get()).data()).toMatchObject({ plateMasked: "DL •• 4821", colour: "Red", noteForVisitors: "In the office opposite", contact: null })
    expect((await privateRef(cmtId).get()).data()!.plate).toBe("DL3CAB4821")

    expect((await call(`/vehicles/${cmtId}`, { token, method: "PATCH", body: { contactMode: "number" } })).status).toBe(400)
    await call(`/vehicles/${cmtId}`, { token, method: "PATCH", body: { contactMode: "number", numberConsent: true } })
    expect((await vehicles.doc(cmtId).get()).data()!.contact).toEqual({ name: "Asha", phone: MOBILE })
    await call(`/vehicles/${cmtId}`, { token, method: "PATCH", body: { contactMode: "chat" } })
    expect((await vehicles.doc(cmtId).get()).data()!.contact).toBeNull()
    expect((await privateRef(cmtId).get()).data()!.numberConsentAt).toBeNull()

    const stranger = await signIn("stranger")
    await call("/me", { token: stranger, method: "PUT", body: { ...ownerBody, mobile: "9876500002" } })
    expect((await call(`/vehicles/${cmtId}`, { token: stranger, method: "PATCH", body: { colour: "Black" } })).status).toBe(404)
    expect((await call(`/vehicles/${cmtId}`, { token: stranger, method: "DELETE" })).status).toBe(404)
  })

  it("removes a vehicle: its page goes, its sticker is freed and its chats close", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    await addTag("CT-7K2M-94XQ")
    await call("/tags/CT-7K2M-94XQ/claim", { token, body: { cmtId } })
    const { json: room } = await call("/rooms", { body: { cmtId, reason: "lights" } })

    expect((await call(`/vehicles/${cmtId}`, { token, method: "DELETE" })).status).toBe(200)
    expect((await vehicles.doc(cmtId).get()).exists).toBe(false)
    expect((await privateRef(cmtId).get()).exists).toBe(false)
    expect((await ownerVehicles("owner-1").doc(cmtId).get()).exists).toBe(false)
    expect((await tags.doc("CT-7K2M-94XQ").get()).data()).toMatchObject({ claimed: false, cmtId: null })
    expect((await rooms.doc(room.roomKey).get()).data()!.status).toBe("closed")
    expect((await chats.get()).docs[0]!.data().status).toBe("closed")
    expect((await call("/scans", { body: { cmtId } })).status).toBe(404)
  })
})

describe("pre-printed stickers", () => {
  const CODE = "CT-7K2M-94XQ"

  it("links a sticker to the owner's vehicle, and moves it between their vehicles", async () => {
    await addTag(CODE)
    const { token, cmtId } = await ownerWithVehicle()
    expect((await call(`/tags/${CODE}/claim`, { token, body: { cmtId } })).status).toBe(200)
    expect((await tags.doc(CODE).get()).data()).toMatchObject({ claimed: true, cmtId })
    expect((await privateRef(cmtId).get()).data()!.tagCodes).toEqual([CODE])

    const second = await call("/vehicles", { token, body: { ...car, plate: "KA 01 A 1234" } })
    await call(`/tags/${CODE}/claim`, { token, body: { cmtId: second.json.cmtId } })
    expect((await privateRef(cmtId).get()).data()!.tagCodes).toEqual([])
    expect((await privateRef(second.json.cmtId).get()).data()!.tagCodes).toEqual([CODE])
  })

  it("refuses another owner's sticker, an unknown sticker and another owner's vehicle", async () => {
    await addTag(CODE)
    const first = await ownerWithVehicle()
    await call(`/tags/${CODE}/claim`, { token: first.token, body: { cmtId: first.cmtId } })
    const second = await ownerWithVehicle("owner-2", null)
    const taken = await call(`/tags/${CODE}/claim`, { token: second.token, body: { cmtId: second.cmtId } })
    expect(taken.json.error.code).toBe("tag_taken")
    expect((await call("/tags/CT-2222-2222/claim", { token: second.token, body: { cmtId: second.cmtId } })).status).toBe(404)
    await addTag("CT-3333-3333")
    expect((await call("/tags/CT-3333-3333/claim", { token: second.token, body: { cmtId: first.cmtId } })).status).toBe(404)
  })
})

describe("scans", () => {
  it("records a scan without alerting anyone", async () => {
    const { cmtId } = await ownerWithVehicle()
    const { status, json } = await call("/scans", { body: { cmtId } })
    expect(status).toBe(201)
    expect((await scans.doc(json.scanId).get()).data()).toMatchObject({ cmtId, ownerUid: "owner-1", plateMasked: "MH •• 1234", vehicleLabel: "White Honda City", via: "id", read: false })
    expect(sent).toHaveLength(0)
  })

  it("limits a visitor to one scan per vehicle every 10 minutes", async () => {
    const { cmtId } = await ownerWithVehicle()
    const first = await call("/scans", { body: { cmtId } })
    expect((await call("/scans", { body: { cmtId } })).json.scanId).toBe(first.json.scanId)
    expect((await call("/scans", { body: { cmtId }, ip: "203.0.113.9" })).json.scanId).not.toBe(first.json.scanId)

    const held = (await throttle.get()).docs.find((doc) => doc.data().scanId === first.json.scanId)!
    await held.ref.update({ until: Date.now() - 1 })
    expect((await call("/scans", { body: { cmtId } })).json.scanId).not.toBe(first.json.scanId)
  })

  it("records the sticker only when it belongs to the vehicle, and refuses unknown vehicles", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    await addTag("CT-7K2M-94XQ")
    await call("/tags/CT-7K2M-94XQ/claim", { token, body: { cmtId } })
    const { json } = await call("/scans", { body: { cmtId, via: "tag", tagCode: "CT-7K2M-94XQ" } })
    expect((await scans.doc(json.scanId).get()).data()).toMatchObject({ via: "tag", tagCode: "CT-7K2M-94XQ" })
    expect((await call("/scans", { body: { cmtId: "CMT-2222-22" } })).status).toBe(404)
  })

  it("marks only the owner's own scans as read", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { json } = await call("/scans", { body: { cmtId } })
    const stranger = await signIn("stranger")
    expect((await call("/scans/mark-read", { token: stranger, body: {} })).json.updated).toBe(0)
    expect((await call("/scans/mark-read", { token, body: {} })).json.updated).toBe(1)
    expect((await scans.doc(json.scanId).get()).data()!.read).toBe(true)
  })
})

describe("sticker requests", () => {
  const order = { name: "Asha Rao", mobile: "9876543210", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pin: "411001" }

  it("records a request for the owner's vehicle", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { status, json } = await call("/sticker-orders", { token, body: { ...order, cmtId } })
    expect(status).toBe(201)
    expect((await stickerOrders.doc(json.id).get()).data()).toMatchObject({ ownerUid: "owner-1", cmtId, plate: "MH12AB1234", status: "requested", mobile: MOBILE })
  })

  it("refuses a bad PIN and another owner's vehicle", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    expect((await call("/sticker-orders", { token, body: { ...order, cmtId, pin: "12" } })).status).toBe(400)
    const stranger = await signIn("stranger")
    expect((await call("/sticker-orders", { token: stranger, body: { ...order, cmtId } })).status).toBe(404)
  })
})
