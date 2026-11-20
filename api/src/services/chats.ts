import {
  BLOCK_DAYS,
  CHAT_KEEP_DAYS,
  CHAT_OPEN_HOURS,
  MAX_NEW_CHATS_PER_HOUR,
  MAX_VISITOR_MESSAGES,
  reasonMessage,
  vehicleLabel,
  type CarChat,
  type ChatMessage,
  type ChatRoom,
  type ReasonId,
} from "@carmitra/shared"

import { randomToken, sha256 } from "../auth"
import { config } from "../config"
import { blocks, chatKeys, chats, db, expireAt, messages, nowIso, rooms, throttle } from "../firebase"
import { ApiError, notFound } from "../http"
import { ownerMobile } from "./owners"
import { readVehicle } from "./vehicles"
import type { Notify } from "./whatsapp"

/*
 * The private chat.
 *
 *   carChats/{chatId}             the owner's side: readable by the owner only
 *   carChatRooms/{roomKey}        the room: readable by anyone holding the key, and nobody can list rooms
 *   .../carMessages/{id}          its messages, readable the same way
 *   carChatKeys/{roomKey}         server only: links the room to its chat, and identifies the visitor
 *
 * Neither the room nor its messages carry the owner's id or anyone's number. Every message goes
 * through here, so the limits below can't be skipped.
 */

const HOUR = 60 * 60 * 1000
/** While the owner has unread messages, further WhatsApp alerts wait this long. */
const ALERT_GAP_MS = 10 * 60 * 1000

type ChatKey = {
  roomKey: string
  chatId: string
  cmtId: string
  ownerUid: string
  /** Who the visitor is, as far as blocking goes: a hash of their IP address and the vehicle. */
  visitorHash: string
  visitorCount: number
  notifiedAt: string | null
}

const chatLink = (chatId: string) => `${config.publicUrl}/app/chats/${chatId}`

const newChatAlert = (label: string, plate: string, first: string, chatId: string) =>
  `🚗 *Someone needs you at your ${label} (${plate}).*\n\n"${first}"\n\nReply in the private chat. Neither of you sees the other's number: ${chatLink(chatId)}`

const followUpAlert = (label: string, plate: string, chatId: string) => `💬 *New message about your ${label} (${plate}).*\n\nReply here: ${chatLink(chatId)}`

const closedError = () => new ApiError(410, "chat_closed", "This chat has closed. Scan the sticker again to start a new one.")

function assertOpen(room: { status: string; closesAt: string }) {
  if (room.status !== "open" || Date.now() > Date.parse(room.closesAt)) throw closedError()
}

type StartChat = { cmtId: string; reason: ReasonId; text: string; ip: string; notify: Notify }

/** Someone at the vehicle picks a reason. That opens a chat and tells the owner on WhatsApp. */
export async function startChat({ cmtId, reason, text, ip, notify }: StartChat): Promise<{ roomKey: string }> {
  const vehicle = await readVehicle(cmtId)
  if (!vehicle) throw notFound("That vehicle")
  const { profile, details } = vehicle

  const visitorHash = sha256(`visitor|${ip}|${cmtId}`)
  const throttleRef = throttle.doc(sha256(`chat|${ip}|${cmtId}`))
  const roomKey = randomToken()
  const chatRef = chats.doc()
  const now = Date.now()
  const nowText = new Date(now).toISOString()
  const closesAt = new Date(now + CHAT_OPEN_HOURS * HOUR).toISOString()
  const keep = expireAt(now, CHAT_KEEP_DAYS)
  const label = vehicleLabel(profile)
  const first = reasonMessage(reason, profile.type)

  const opening: Omit<ChatMessage, "id">[] = [{ from: "visitor", text: first, createdAt: nowText }]
  // One millisecond later, so the two always sort in the order they were written.
  if (text) opening.push({ from: "visitor", text, createdAt: new Date(now + 1).toISOString() })
  const last = opening.at(-1)!

  await db.runTransaction(async (tx) => {
    const [block, held] = await Promise.all([tx.get(blocks.doc(visitorHash)), tx.get(throttleRef)])
    if (block.exists && (block.data()!.until as number) > now) {
      throw new ApiError(403, "blocked", "The owner of this vehicle isn't taking messages from you.")
    }
    const window = held.data()
    const inWindow = window && now - (window.windowStart as number) < HOUR
    if (inWindow && (window.count as number) >= MAX_NEW_CHATS_PER_HOUR) {
      throw new ApiError(429, "too_many_chats", "You've started several chats with this owner. Please use the one you already have, or wait a while.")
    }
    tx.set(throttleRef, inWindow ? { ...window, count: (window.count as number) + 1 } : { count: 1, windowStart: now, expireAt: expireAt(now, 1) })

    const chat: CarChat = {
      chatId: chatRef.id,
      roomKey,
      cmtId,
      ownerUid: details.ownerUid,
      plateMasked: profile.plateMasked,
      vehicleLabel: label,
      reason,
      status: "open",
      unreadForOwner: opening.length,
      lastMessage: last.text,
      lastFrom: "visitor",
      lastMessageAt: last.createdAt,
      createdAt: nowText,
      closesAt,
    }
    const room: ChatRoom = { cmtId, plateMasked: profile.plateMasked, vehicleLabel: label, reason, status: "open", ownerSeenAt: null, createdAt: nowText, closesAt }
    const key: ChatKey = { roomKey, chatId: chatRef.id, cmtId, ownerUid: details.ownerUid, visitorHash, visitorCount: opening.length, notifiedAt: nowText }

    tx.create(chatRef, { ...chat, expireAt: keep })
    tx.create(rooms.doc(roomKey), { ...room, expireAt: keep })
    tx.create(chatKeys.doc(roomKey), { ...key, expireAt: keep })
    for (const message of opening) {
      const ref = messages(roomKey).doc()
      tx.create(ref, { ...message, id: ref.id, expireAt: keep })
    }
  })

  const mobile = await ownerMobile(details.ownerUid)
  if (mobile) await notify(mobile, newChatAlert(label, profile.plateMasked, first, chatRef.id))
  return { roomKey }
}

/** A message from the person at the vehicle. */
export async function visitorMessage(roomKey: string, text: string, notify: Notify) {
  const keyRef = chatKeys.doc(roomKey)
  const result = await db.runTransaction(async (tx) => {
    const [keySnap, roomSnap] = await Promise.all([tx.get(keyRef), tx.get(rooms.doc(roomKey))])
    const key = keySnap.data() as ChatKey | undefined
    const room = roomSnap.data() as ChatRoom | undefined
    if (!key || !room) throw notFound("That chat")
    assertOpen(room)
    if (key.visitorCount >= MAX_VISITOR_MESSAGES) {
      throw new ApiError(429, "message_limit", "You've sent as many messages as this chat allows. The owner has them all.")
    }
    const chatRef = chats.doc(key.chatId)
    const chat = (await tx.get(chatRef)).data() as CarChat | undefined
    if (!chat) throw notFound("That chat")

    const now = Date.now()
    const nowText = new Date(now).toISOString()
    const alert = chat.unreadForOwner === 0 || !key.notifiedAt || now - Date.parse(key.notifiedAt) > ALERT_GAP_MS

    const ref = messages(roomKey).doc()
    tx.create(ref, { id: ref.id, from: "visitor", text, createdAt: nowText, expireAt: expireAt(Date.parse(chat.createdAt), CHAT_KEEP_DAYS) })
    tx.update(keyRef, { visitorCount: key.visitorCount + 1, ...(alert ? { notifiedAt: nowText } : {}) })
    tx.update(chatRef, { unreadForOwner: chat.unreadForOwner + 1, lastMessage: text, lastFrom: "visitor", lastMessageAt: nowText })
    return { alert, chat, ownerUid: key.ownerUid }
  })

  if (result.alert) {
    const mobile = await ownerMobile(result.ownerUid)
    if (mobile) await notify(mobile, followUpAlert(result.chat.vehicleLabel, result.chat.plateMasked, result.chat.chatId))
  }
}

/** Someone else's chat looks the same as no chat at all. */
async function readOwnedChat(chatId: string, uid: string): Promise<CarChat> {
  const chat = (await chats.doc(chatId).get()).data() as CarChat | undefined
  if (!chat || chat.ownerUid !== uid) throw notFound("That chat")
  return chat
}

export async function ownerReply(chatId: string, uid: string, text: string) {
  const chat = await readOwnedChat(chatId, uid)
  assertOpen(chat)
  const nowText = nowIso()
  const ref = messages(chat.roomKey).doc()
  const batch = db.batch()
  batch.create(ref, { id: ref.id, from: "owner", text, createdAt: nowText, expireAt: expireAt(Date.parse(chat.createdAt), CHAT_KEEP_DAYS) })
  batch.update(chats.doc(chatId), { unreadForOwner: 0, lastMessage: text, lastFrom: "owner", lastMessageAt: nowText })
  batch.update(rooms.doc(chat.roomKey), { ownerSeenAt: nowText })
  await batch.commit()
}

/** The owner has opened the chat: the visitor sees "Seen". */
export async function markChatRead(chatId: string, uid: string) {
  const chat = await readOwnedChat(chatId, uid)
  const batch = db.batch()
  batch.update(chats.doc(chatId), { unreadForOwner: 0 })
  batch.update(rooms.doc(chat.roomKey), { ownerSeenAt: nowIso() })
  await batch.commit()
}

export async function closeChat(chatId: string, uid: string) {
  const chat = await readOwnedChat(chatId, uid)
  if (chat.status !== "open") return
  const batch = db.batch()
  batch.update(chats.doc(chatId), { status: "closed", unreadForOwner: 0 })
  batch.update(rooms.doc(chat.roomKey), { status: "closed" })
  await batch.commit()
}

/** Closes the chat, and refuses new chats from the same person for this vehicle for 30 days. */
export async function blockChat(chatId: string, uid: string) {
  const chat = await readOwnedChat(chatId, uid)
  const key = (await chatKeys.doc(chat.roomKey).get()).data() as ChatKey | undefined
  const now = Date.now()
  const batch = db.batch()
  batch.update(chats.doc(chatId), { status: "blocked", unreadForOwner: 0 })
  batch.update(rooms.doc(chat.roomKey), { status: "blocked" })
  if (key) batch.set(blocks.doc(key.visitorHash), { cmtId: chat.cmtId, ownerUid: uid, until: now + BLOCK_DAYS * 24 * HOUR, expireAt: expireAt(now, BLOCK_DAYS) })
  await batch.commit()
}
