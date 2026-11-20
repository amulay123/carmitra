import { Router } from "express"
import { z } from "zod"

import { messageSchema, ownerInputSchema, stickerOrderSchema, vehicleInputSchema, vehiclePatchSchema, type MeResponse } from "@carmitra/shared"

import { requireUser, userOf } from "../auth"
import { ApiError } from "../http"
import { blockChat, closeChat, markChatRead, ownerReply } from "../services/chats"
import { prefillFor, readOwner, saveOwner } from "../services/owners"
import { markScansRead } from "../services/scans"
import { claimTag, createStickerOrder } from "../services/tags"
import { createVehicle, removeVehicle, updateVehicle } from "../services/vehicles"

async function ownerFor(uid: string) {
  const owner = await readOwner(uid)
  if (!owner?.name || !owner.city || !owner.mobile) throw new ApiError(409, "owner_required", "Add your name, mobile and city first.")
  return owner
}

const param = (value: unknown) => String(value)

export function ownerRoutes() {
  const router = Router()
  router.use(requireUser)

  router.get("/me", async (req, res) => {
    const user = userOf(req)
    const [owner, prefill] = await Promise.all([readOwner(user.uid), prefillFor(user)])
    res.json({ owner, prefill } satisfies MeResponse)
  })

  router.put("/me", async (req, res) => {
    const input = ownerInputSchema.parse(req.body)
    res.json({ owner: await saveOwner(userOf(req), input) })
  })

  router.post("/vehicles", async (req, res) => {
    const input = vehicleInputSchema.parse(req.body)
    const owner = await ownerFor(userOf(req).uid)
    res.status(201).json(await createVehicle(owner, input))
  })

  router.patch("/vehicles/:cmtId", async (req, res) => {
    const patch = vehiclePatchSchema.parse(req.body)
    const owner = await ownerFor(userOf(req).uid)
    await updateVehicle(param(req.params.cmtId), owner, patch)
    res.json({ ok: true })
  })

  router.delete("/vehicles/:cmtId", async (req, res) => {
    await removeVehicle(param(req.params.cmtId), userOf(req).uid)
    res.json({ ok: true })
  })

  router.post("/tags/:code/claim", async (req, res) => {
    const { cmtId } = z.object({ cmtId: z.string() }).parse(req.body)
    await claimTag(param(req.params.code), cmtId, userOf(req).uid)
    res.json({ ok: true, cmtId })
  })

  router.post("/sticker-orders", async (req, res) => {
    const id = await createStickerOrder(userOf(req).uid, stickerOrderSchema.parse(req.body))
    res.status(201).json({ id })
  })

  router.post("/scans/mark-read", async (req, res) => {
    res.json({ updated: await markScansRead(userOf(req).uid) })
  })

  router.post("/chats/:chatId/messages", async (req, res) => {
    const { text } = messageSchema.parse(req.body)
    await ownerReply(param(req.params.chatId), userOf(req).uid, text)
    res.status(201).json({ ok: true })
  })

  router.post("/chats/:chatId/read", async (req, res) => {
    await markChatRead(param(req.params.chatId), userOf(req).uid)
    res.json({ ok: true })
  })

  router.post("/chats/:chatId/close", async (req, res) => {
    await closeChat(param(req.params.chatId), userOf(req).uid)
    res.json({ ok: true })
  })

  router.post("/chats/:chatId/block", async (req, res) => {
    await blockChat(param(req.params.chatId), userOf(req).uid)
    res.json({ ok: true })
  })

  return router
}
