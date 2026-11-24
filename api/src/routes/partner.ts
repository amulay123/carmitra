import { Router, type Request } from "express"
import { z } from "zod"

import { COLOURS, mobileSchema, plateSchema, scanPath, VEHICLE_TYPES, type Colour } from "@carmitra/shared"

import { partnerOf, requirePartner } from "../auth"
import { config } from "../config"
import { ApiError, notFound } from "../http"
import { ensurePartnerOwner, findOrCreateUser, ownerVehicleIds, uidForMobile } from "../services/owners"
import { createPartnerVehicle, partnerVehicleView, readVehicle } from "../services/vehicles"

/*
 * The partner API: a partner's server (TommyAndFurry's, first) creates users from mobiles it
 * has verified with its own OTP, and adds their vehicles. docs/tommyandfurry-integration.md
 * is the guide for the partner's developers.
 */

const consentSchema = z.object({
  version: z.string().trim().min(1).max(60),
  at: z.iso.datetime({ offset: true }),
  /** True only if the customer agreed that anyone who scans may see and call their mobile. */
  showNumber: z.boolean().optional(),
})

const ownerSchema = z.object({ name: z.string().trim().max(60).optional(), city: z.string().trim().max(60).optional() }).optional()

/** A partner's colour names vary ("Pearl White"); one we don't draw is left out rather than refused. */
function toColour(value: string): Colour | "" {
  const name = value.trim().toLowerCase().replace(/^gray$/, "grey")
  return COLOURS.find((colour) => colour.toLowerCase() === name) ?? ""
}

const vehicleSchema = z.object({
  type: z.enum(VEHICLE_TYPES, "Send car, bike or other."),
  plate: plateSchema,
  // A long make and model is shortened rather than refused, so an insurance journey never fails on it.
  model: z.string().trim().max(120).default("").transform((value) => value.slice(0, 40).trim()),
  colour: z.string().trim().max(60).default("").transform(toColour),
})

const createOwnerSchema = z.object({ mobile: mobileSchema, owner: ownerSchema, consent: consentSchema })

const createVehicleSchema = z.object({
  mobile: mobileSchema,
  partnerRef: z.string().trim().min(1).max(120).optional(),
  vehicle: vehicleSchema,
  owner: ownerSchema,
  consent: consentSchema,
})

const param = (req: Request, name: string) => req.params[name] as string

export function partnerRoutes() {
  const router = Router()
  router.use(requirePartner)

  router.post("/owners", async (req, res) => {
    const input = createOwnerSchema.parse(req.body)
    const { uid, isNewUser } = await findOrCreateUser(input.mobile)
    const { created } = await ensurePartnerOwner({ uid, mobile: input.mobile, partnerId: partnerOf(req).id, ...input.owner, consent: input.consent })
    res.status(created ? 201 : 200).json({ mobile: input.mobile, isNewUser, created })
  })

  router.post("/vehicles", async (req, res) => {
    const partner = partnerOf(req)
    const input = createVehicleSchema.parse(req.body)
    const { uid, isNewUser } = await findOrCreateUser(input.mobile)
    const { owner } = await ensurePartnerOwner({ uid, mobile: input.mobile, partnerId: partner.id, ...input.owner, consent: input.consent })
    const showNumber = input.consent.showNumber === true
    const { cmtId, created } = await createPartnerVehicle(
      owner,
      { ...input.vehicle, contactMode: showNumber ? "number" : "chat", numberConsent: showNumber, noteForVisitors: "" },
      { id: partner.id, ref: input.partnerRef },
    )
    res.status(created ? 201 : 200).json({ cmtId, scanUrl: `${config.publicUrl}${scanPath(cmtId)}`, isNewUser, created })
  })

  router.get("/owners/:mobile/vehicles", async (req, res) => {
    const uid = await uidForMobile(mobileSchema.parse(param(req, "mobile")))
    const ids = uid ? await ownerVehicleIds(uid) : []
    const found = await Promise.all(ids.map(readVehicle))
    res.json({ vehicles: found.filter((vehicle) => vehicle !== null).map(partnerVehicleView) })
  })

  router.get("/vehicles/:cmtId", async (req, res) => {
    const mobile = mobileSchema.parse(req.query.mobile)
    const vehicle = await readVehicle(param(req, "cmtId"))
    if (!vehicle) throw notFound("That vehicle")
    if ((await uidForMobile(mobile)) !== vehicle.details.ownerUid) throw new ApiError(403, "mobile_mismatch", "That mobile doesn't own this vehicle.")
    res.json(partnerVehicleView(vehicle))
  })

  // Without this, a mistyped partner address would fall through to the sign-in routes.
  router.use(() => {
    throw notFound("That address")
  })

  return router
}
