import { z } from "zod"

import { normalizeMobile } from "./phone"

/** Draft until the wording required by the DPDP Act, 2023 is agreed. */
export const CONSENT_VERSION = "draft-2026-11"

export const mobileSchema = z.string("Enter your 10-digit mobile number.").transform((value, ctx) => {
  const mobile = normalizeMobile(value)
  if (!mobile) {
    ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit mobile number." })
    return z.NEVER
  }
  return mobile
})

/** The owner's own details. Whether their number is shown is chosen per vehicle. */
export const ownerInputSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60, "Keep your name under 60 characters."),
  mobile: mobileSchema,
  city: z.string().trim().min(1, "Enter your city.").max(60, "Keep the city under 60 characters."),
  consent: z.object({ accepted: z.literal(true, "Please agree to continue.") }),
})
export type OwnerInput = z.input<typeof ownerInputSchema>

export const stickerOrderSchema = z.object({
  cmtId: z.string().min(1, "Choose a vehicle."),
  name: z.string().trim().min(1, "Enter the recipient's name.").max(60),
  mobile: mobileSchema,
  line1: z.string().trim().min(1, "Enter the address.").max(120),
  line2: z.string().trim().max(120).default(""),
  city: z.string().trim().min(1, "Enter the city.").max(60),
  state: z.string().trim().min(1, "Enter the state.").max(60),
  pin: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit PIN code."),
})
export type StickerOrderInput = z.input<typeof stickerOrderSchema>

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? ""

/** Field name to first message, for showing errors beside form fields. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    out[key] ??= issue.message
  }
  return out
}
