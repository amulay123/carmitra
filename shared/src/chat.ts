import { z } from "zod"

import { REASON_IDS } from "./vehicle"

/*
 * The private chat between someone at a vehicle and its owner. Neither side sees the other's
 * number. The visitor holds a long random room key; the owner opens the chat signed in.
 */

export const MAX_MESSAGE_LENGTH = 500
/** How many messages one visitor can send in one chat. */
export const MAX_VISITOR_MESSAGES = 20
/** A chat takes messages for this long after it opens. */
export const CHAT_OPEN_HOURS = 24
/** Chats and their messages are deleted this long after they open. */
export const CHAT_KEEP_DAYS = 30
/** New chats one connection can open for one vehicle in an hour. */
export const MAX_NEW_CHATS_PER_HOUR = 3
/** How long a block lasts. */
export const BLOCK_DAYS = 30

/** One-tap replies for the owner. */
export const QUICK_REPLIES = ["Coming in 5 minutes.", "Moving it now.", "Thank you for telling me.", "Sorry, I can't come right now."] as const

/** The line both sides see under the chat. */
export const SAFETY_NOTE = "Carmitra never asks for OTPs, passwords or payments in a chat."

export const messageSchema = z.object({
  text: z.string().trim().min(1, "Type a message.").max(MAX_MESSAGE_LENGTH, `Keep a message under ${MAX_MESSAGE_LENGTH} characters.`),
})

export const startChatSchema = z.object({
  cmtId: z.string().max(20),
  reason: z.enum(REASON_IDS, "Pick what's happening."),
  text: z.string().trim().max(MAX_MESSAGE_LENGTH, `Keep a message under ${MAX_MESSAGE_LENGTH} characters.`).default(""),
})

/** Where a visitor's browser remembers their chat for a vehicle, so scanning again reopens it. */
export const roomStorageKey = (cmtId: string) => `carmitra-room-${cmtId}`
