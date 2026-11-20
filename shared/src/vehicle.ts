import { z } from "zod"

import { normalizePlate } from "./plate"

export const VEHICLE_TYPES = ["car", "bike", "other"] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const vehicleTypeLabel: Record<VehicleType, string> = {
  car: "Car",
  bike: "Bike or scooter",
  other: "Other vehicle",
}

/** The word used for the vehicle in sentences: "your car is blocking mine". */
export const vehicleWord: Record<VehicleType, string> = { car: "car", bike: "bike", other: "vehicle" }

export const COLOURS = ["White", "Silver", "Grey", "Black", "Red", "Blue", "Brown", "Green", "Yellow", "Orange"] as const
export type Colour = (typeof COLOURS)[number]

/** Why someone is scanning. The chosen reason is the first message the owner reads. */
export const REASONS = [
  { id: "blocking", label: "Blocking my vehicle", message: (v: string) => `Your ${v} is blocking mine. Could you move it?` },
  { id: "lights", label: "Lights are on", message: (v: string) => `The lights on your ${v} are on.` },
  { id: "open", label: "Window or door open", message: (v: string) => `A window or door on your ${v} is open.` },
  { id: "towing", label: "Parking or towing", message: (v: string) => `Your ${v} may be towed or fined where it is parked.` },
  { id: "damage", label: "Accident or damage", message: (v: string) => `Your ${v} has been hit or damaged.` },
  { id: "other", label: "Something else", message: (v: string) => `I need to speak to you about your ${v}.` },
] as const
export type ReasonId = (typeof REASONS)[number]["id"]
export const REASON_IDS = REASONS.map((reason) => reason.id) as [ReasonId, ...ReasonId[]]

export const reasonLabel = (id: ReasonId) => REASONS.find((reason) => reason.id === id)?.label ?? "Something else"
export const reasonMessage = (id: ReasonId, type: VehicleType) => (REASONS.find((reason) => reason.id === id) ?? REASONS[5]).message(vehicleWord[type])

/** "White Honda City", or "Car" when the owner gave neither. */
export function vehicleLabel(vehicle: { type: VehicleType; model: string; colour: string }): string {
  return [vehicle.colour, vehicle.model].filter(Boolean).join(" ") || vehicleTypeLabel[vehicle.type]
}

export const MAX_NOTE_LENGTH = 200

export const CONTACT_MODES = ["chat", "number"] as const

/** A registration number as typed, stored without spaces in capitals. */
export const plateSchema = z.string("Enter the registration number.").transform((value, ctx) => {
  const plate = normalizePlate(value)
  if (!plate) {
    ctx.addIssue({ code: "custom", message: "Enter a registration number like MH 12 AB 1234." })
    return z.NEVER
  }
  return plate
})

const detailsShape = {
  type: z.enum(VEHICLE_TYPES, "Choose the kind of vehicle."),
  plate: plateSchema,
  model: z.string().trim().max(40, "Keep the make and model under 40 characters.").default(""),
  colour: z.union([z.enum(COLOURS), z.literal("")], "Choose a colour.").default(""),
}

const reachShape = {
  contactMode: z.enum(CONTACT_MODES, "Choose how people reach you."),
  noteForVisitors: z.string().trim().max(MAX_NOTE_LENGTH, `Keep the note under ${MAX_NOTE_LENGTH} characters.`).default(""),
  numberConsent: z.boolean().default(false),
}

/** Showing the number needs the owner's say-so, given with this choice. */
function checkConsent(reach: { contactMode?: string; numberConsent?: boolean }, ctx: z.RefinementCtx) {
  if (reach.contactMode === "number" && !reach.numberConsent) {
    ctx.addIssue({ code: "custom", path: ["numberConsent"], message: "Tick the box to show your number, or choose chat only." })
  }
}

/** What the owner tells us about a vehicle. */
export const vehicleDetailsSchema = z.object(detailsShape)
export type VehicleDetails = z.infer<typeof vehicleDetailsSchema>

/** How people who scan can reach the owner. */
export const reachSchema = z.object(reachShape).superRefine(checkConsent)
export type Reach = z.infer<typeof reachSchema>

/** A new vehicle: its details and how people reach the owner. */
export const vehicleInputSchema = z.object({ ...detailsShape, ...reachShape }).superRefine(checkConsent)
export type VehicleInput = z.input<typeof vehicleInputSchema>

/** An edit may change the details, the contact choice, or both. */
export const vehiclePatchSchema = z
  .object({
    type: detailsShape.type.optional(),
    plate: plateSchema.optional(),
    model: z.string().trim().max(40, "Keep the make and model under 40 characters.").optional(),
    colour: z.union([z.enum(COLOURS), z.literal("")]).optional(),
    contactMode: reachShape.contactMode.optional(),
    noteForVisitors: z.string().trim().max(MAX_NOTE_LENGTH, `Keep the note under ${MAX_NOTE_LENGTH} characters.`).optional(),
    numberConsent: z.boolean().optional(),
  })
  .superRefine(checkConsent)
export type VehiclePatch = z.input<typeof vehiclePatchSchema>
