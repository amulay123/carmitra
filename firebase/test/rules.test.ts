import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing"
import { collection, collectionGroup, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

let env: RulesTestEnvironment

const [firestoreHost = "127.0.0.1", firestorePort = "8091"] = (process.env.FIRESTORE_EMULATOR_HOST ?? "").split(":")
const ROOM = "k".repeat(43)

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-carmitra",
    firestore: { host: firestoreHost, port: Number(firestorePort), rules: readFileSync(resolve(__dirname, "../firestore.rules"), "utf8") },
  })
})
afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, "carOwners/asha"), { uid: "asha", mobile: "+919876543210" })
    await setDoc(doc(db, "carOwners/asha/vehicles/CMT-7K2M-94"), { cmtId: "CMT-7K2M-94", plate: "MH12AB1234" })
    await setDoc(doc(db, "carVehicles/CMT-7K2M-94"), { cmtId: "CMT-7K2M-94", plateMasked: "MH •• 1234" })
    await setDoc(doc(db, "carVehicles/CMT-7K2M-94/private/details"), { ownerUid: "asha", plate: "MH12AB1234" })
    await setDoc(doc(db, "carTags/CT-7K2M-94XQ"), { code: "CT-7K2M-94XQ", claimed: false })
    await setDoc(doc(db, "carScans/s1"), { ownerUid: "asha", cmtId: "CMT-7K2M-94" })
    await setDoc(doc(db, "carScans/s2"), { ownerUid: "ravi", cmtId: "CMT-AAAA-AA" })
    await setDoc(doc(db, "carStickerOrders/o1"), { ownerUid: "asha" })
    await setDoc(doc(db, "carChats/c1"), { ownerUid: "asha", roomKey: ROOM })
    await setDoc(doc(db, `carChatRooms/${ROOM}`), { status: "open" })
    await setDoc(doc(db, `carChatRooms/${ROOM}/carMessages/m1`), { from: "visitor", text: "Hello" })
    await setDoc(doc(db, `carChatKeys/${ROOM}`), { chatId: "c1", visitorHash: "x" })
    await setDoc(doc(db, "carThrottle/t1"), { scanId: "s1" })
    await setDoc(doc(db, "carBlocks/b1"), { until: 1 })
  })
})

const asha = () => env.authenticatedContext("asha").firestore()
const ravi = () => env.authenticatedContext("ravi").firestore()
const anon = () => env.unauthenticatedContext().firestore()

describe("Firestore", () => {
  it("lets anyone read one vehicle, but nobody list them", async () => {
    await assertSucceeds(getDoc(doc(anon(), "carVehicles/CMT-7K2M-94")))
    await assertFails(getDocs(collection(anon(), "carVehicles")))
    await assertFails(getDocs(collection(asha(), "carVehicles")))
  })

  it("keeps a vehicle's full plate and owner to its owner", async () => {
    await assertSucceeds(getDoc(doc(asha(), "carVehicles/CMT-7K2M-94/private/details")))
    await assertFails(getDoc(doc(ravi(), "carVehicles/CMT-7K2M-94/private/details")))
    await assertFails(getDoc(doc(anon(), "carVehicles/CMT-7K2M-94/private/details")))
  })

  it("keeps owner records and vehicle lists to the owner", async () => {
    await assertSucceeds(getDoc(doc(asha(), "carOwners/asha")))
    await assertSucceeds(getDocs(collection(asha(), "carOwners/asha/vehicles")))
    await assertFails(getDoc(doc(ravi(), "carOwners/asha")))
    await assertFails(getDocs(collection(ravi(), "carOwners/asha/vehicles")))
  })

  it("lets anyone look up one sticker, but not list them", async () => {
    await assertSucceeds(getDoc(doc(anon(), "carTags/CT-7K2M-94XQ")))
    await assertFails(getDocs(collection(anon(), "carTags")))
  })

  it("shows owners only their own scans, orders and chats", async () => {
    const mine = await assertSucceeds(getDocs(query(collection(asha(), "carScans"), where("ownerUid", "==", "asha"))))
    expect(mine.size).toBe(1)
    await assertFails(getDocs(collection(asha(), "carScans")))
    await assertFails(getDocs(query(collection(asha(), "carScans"), where("ownerUid", "==", "ravi"))))
    await assertSucceeds(getDocs(query(collection(asha(), "carStickerOrders"), where("ownerUid", "==", "asha"))))
    await assertSucceeds(getDocs(query(collection(asha(), "carChats"), where("ownerUid", "==", "asha"))))
    await assertFails(getDoc(doc(ravi(), "carChats/c1")))
    await assertFails(getDoc(doc(anon(), "carChats/c1")))
  })

  it("opens a chat room and its messages to whoever holds the key, and to nobody else", async () => {
    await assertSucceeds(getDoc(doc(anon(), `carChatRooms/${ROOM}`)))
    await assertSucceeds(getDocs(collection(anon(), `carChatRooms/${ROOM}/carMessages`)))
    await assertFails(getDocs(collection(anon(), "carChatRooms")))
    await assertFails(getDocs(collection(asha(), "carChatRooms")))
    await assertFails(getDocs(collectionGroup(anon(), "carMessages")))
  })

  it.each(["carChatKeys/" + "k".repeat(43), "carThrottle/t1", "carBlocks/b1"])("gives no access to %s", async (path) => {
    await assertFails(getDoc(doc(asha(), path)))
    await assertFails(getDoc(doc(anon(), path)))
  })

  it.each([
    "carOwners/asha",
    "carOwners/asha/vehicles/CMT-2222-22",
    "carVehicles/CMT-7K2M-94",
    "carVehicles/CMT-7K2M-94/private/details",
    "carTags/CT-7K2M-94XQ",
    "carScans/s1",
    "carStickerOrders/o1",
    "carChats/c1",
    `carChatRooms/${ROOM}`,
    `carChatRooms/${ROOM}/carMessages/m2`,
  ])("lets no browser write %s", async (path) => {
    await assertFails(setDoc(doc(asha(), path), { ownerUid: "asha" }))
    await assertFails(setDoc(doc(anon(), path), { ownerUid: "asha" }))
  })
})
