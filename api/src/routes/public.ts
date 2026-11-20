import { Router } from "express"
import { z } from "zod"

import { messageSchema, startChatSchema } from "@carmitra/shared"

import { startChat, visitorMessage } from "../services/chats"
import { recordScan } from "../services/scans"
import type { Notify } from "../services/whatsapp"

const scanSchema = z.object({
  cmtId: z.string().max(20),
  via: z.enum(["id", "tag"]).default("id"),
  tagCode: z.string().max(20).optional(),
})

/** What anyone can call, with no sign-in: the person at the vehicle. */
export function publicRoutes(notify: Notify) {
  const router = Router()

  router.get("/health", (_req, res) => {
    res.json({ ok: true })
  })

  router.post("/scans", async (req, res) => {
    const input = scanSchema.parse(req.body)
    const { scanId } = await recordScan({ ...input, ip: req.ip ?? "unknown" })
    res.status(201).json({ scanId })
  })

  router.post("/rooms", async (req, res) => {
    const input = startChatSchema.parse(req.body)
    const { roomKey } = await startChat({ ...input, ip: req.ip ?? "unknown", notify })
    res.status(201).json({ roomKey })
  })

  router.post("/rooms/:roomKey/messages", async (req, res) => {
    const roomKey = z.string().min(30).max(60).parse(req.params.roomKey)
    const { text } = messageSchema.parse(req.body)
    await visitorMessage(roomKey, text, notify)
    res.status(201).json({ ok: true })
  })

  return router
}
