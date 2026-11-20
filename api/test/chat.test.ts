import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { MAX_NEW_CHATS_PER_HOUR, MAX_VISITOR_MESSAGES } from "@carmitra/shared"

import { blocks, chatKeys, chats, messages, rooms } from "../src/firebase"
import { call, car, MOBILE, ownerWithVehicle, resetEmulators, sent, signIn, startServer, stopServer } from "./helpers"

beforeAll(startServer)
afterAll(stopServer)
beforeEach(resetEmulators)

async function chatFor(cmtId: string, body: Record<string, unknown> = {}, ip?: string) {
  const res = await call("/rooms", { body: { cmtId, reason: "blocking", ...body }, ip })
  if (res.status !== 201) throw new Error(JSON.stringify(res.json))
  const roomKey = res.json.roomKey as string
  const chat = (await chats.where("roomKey", "==", roomKey).get()).docs[0]!.data()
  return { roomKey, chatId: chat.chatId as string }
}

const thread = async (roomKey: string) => (await messages(roomKey).orderBy("createdAt").get()).docs.map((doc) => doc.data())

describe("starting a chat", () => {
  it("opens a room from a reason and alerts the owner on WhatsApp", async () => {
    const { cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId, { text: "I'm at the gate." })
    expect(roomKey.length).toBeGreaterThanOrEqual(40)

    expect((await thread(roomKey)).map((m) => [m.from, m.text])).toEqual([
      ["visitor", "Your car is blocking mine. Could you move it?"],
      ["visitor", "I'm at the gate."],
    ])
    expect((await chats.doc(chatId).get()).data()).toMatchObject({ ownerUid: "owner-1", cmtId, status: "open", unreadForOwner: 2, reason: "blocking", lastFrom: "visitor" })
    expect(sent).toHaveLength(1)
    expect(sent[0]!.mobile).toBe(MOBILE)
    expect(sent[0]!.message).toContain("Your car is blocking mine")
    expect(sent[0]!.message).toContain(`https://carmitra.test/app/chats/${chatId}`)
  })

  it("keeps the owner's id and number out of everything the visitor can read", async () => {
    const { cmtId } = await ownerWithVehicle("owner-1", MOBILE, { ...car, contactMode: "number", numberConsent: true })
    const { roomKey } = await chatFor(cmtId)
    const visible = JSON.stringify([(await rooms.doc(roomKey).get()).data(), await thread(roomKey)])
    expect(visible).not.toContain("owner-1")
    expect(visible).not.toContain("9876543210")
    expect(visible).not.toContain("MH12AB1234")
  })

  it("refuses an unknown vehicle or reason", async () => {
    expect((await call("/rooms", { body: { cmtId: "CMT-2222-22", reason: "lights" } })).status).toBe(404)
    const { cmtId } = await ownerWithVehicle()
    expect((await call("/rooms", { body: { cmtId, reason: "bored" } })).status).toBe(400)
  })

  it(`limits one connection to ${MAX_NEW_CHATS_PER_HOUR} new chats per vehicle an hour`, async () => {
    const { cmtId } = await ownerWithVehicle()
    for (let i = 0; i < MAX_NEW_CHATS_PER_HOUR; i++) await chatFor(cmtId)
    const refused = await call("/rooms", { body: { cmtId, reason: "lights" } })
    expect(refused.status).toBe(429)
    expect(refused.json.error.code).toBe("too_many_chats")
    expect((await call("/rooms", { body: { cmtId, reason: "lights" }, ip: "203.0.113.50" })).status).toBe(201)
  })
})

describe("messages", () => {
  it("lets both sides write, and tells the visitor when the owner has seen it", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId)

    expect((await call(`/chats/${chatId}/read`, { token, body: {} })).status).toBe(200)
    expect((await rooms.doc(roomKey).get()).data()!.ownerSeenAt).toBeTruthy()
    expect((await chats.doc(chatId).get()).data()!.unreadForOwner).toBe(0)

    expect((await call(`/chats/${chatId}/messages`, { token, body: { text: "Coming in 5 minutes." } })).status).toBe(201)
    expect((await call(`/rooms/${roomKey}/messages`, { body: { text: "Thank you!" } })).status).toBe(201)
    expect((await thread(roomKey)).map((m) => m.from)).toEqual(["visitor", "owner", "visitor"])
    expect((await chats.doc(chatId).get()).data()).toMatchObject({ unreadForOwner: 1, lastMessage: "Thank you!", lastFrom: "visitor" })
  })

  it("alerts the owner again only after a pause while messages are unread", async () => {
    const { cmtId } = await ownerWithVehicle()
    const { roomKey } = await chatFor(cmtId)
    await call(`/rooms/${roomKey}/messages`, { body: { text: "Hello?" } })
    expect(sent).toHaveLength(1)

    await chatKeys.doc(roomKey).update({ notifiedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString() })
    await call(`/rooms/${roomKey}/messages`, { body: { text: "Still here." } })
    expect(sent).toHaveLength(2)
    expect(sent[1]!.message).toContain("New message about your White Honda City")
  })

  it(`stops a visitor at ${MAX_VISITOR_MESSAGES} messages`, async () => {
    const { cmtId } = await ownerWithVehicle()
    const { roomKey } = await chatFor(cmtId)
    await chatKeys.doc(roomKey).update({ visitorCount: MAX_VISITOR_MESSAGES })
    const refused = await call(`/rooms/${roomKey}/messages`, { body: { text: "One more" } })
    expect(refused.status).toBe(429)
    expect(refused.json.error.code).toBe("message_limit")
  })

  it("closes the chat for both sides after 24 hours", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId)
    const past = new Date(Date.now() - 1000).toISOString()
    await rooms.doc(roomKey).update({ closesAt: past })
    await chats.doc(chatId).update({ closesAt: past })
    expect((await call(`/rooms/${roomKey}/messages`, { body: { text: "Hello?" } })).status).toBe(410)
    expect((await call(`/chats/${chatId}/messages`, { token, body: { text: "Sorry" } })).status).toBe(410)
  })

  it("refuses an unknown room, an empty message and another owner's chat", async () => {
    const { cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId)
    expect((await call(`/rooms/${"x".repeat(43)}/messages`, { body: { text: "Hi" } })).status).toBe(404)
    expect((await call(`/rooms/${roomKey}/messages`, { body: { text: "   " } })).status).toBe(400)
    const stranger = await signIn("stranger")
    expect((await call(`/chats/${chatId}/messages`, { token: stranger, body: { text: "Hi" } })).status).toBe(404)
    expect((await call(`/chats/${chatId}/block`, { token: stranger, body: {} })).status).toBe(404)
  })
})

describe("closing and blocking", () => {
  it("closes a chat for the visitor", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId)
    await call(`/chats/${chatId}/close`, { token, body: {} })
    expect((await rooms.doc(roomKey).get()).data()!.status).toBe("closed")
    expect((await call(`/rooms/${roomKey}/messages`, { body: { text: "Hello?" } })).status).toBe(410)
  })

  it("blocks the visitor from that vehicle, but not other visitors", async () => {
    const { token, cmtId } = await ownerWithVehicle()
    const { roomKey, chatId } = await chatFor(cmtId)
    await call(`/chats/${chatId}/block`, { token, body: {} })
    expect((await rooms.doc(roomKey).get()).data()!.status).toBe("blocked")
    expect((await blocks.get()).size).toBe(1)

    const again = await call("/rooms", { body: { cmtId, reason: "lights" } })
    expect(again.status).toBe(403)
    expect(again.json.error.code).toBe("blocked")
    expect((await call("/rooms", { body: { cmtId, reason: "lights" }, ip: "203.0.113.77" })).status).toBe(201)
  })
})
