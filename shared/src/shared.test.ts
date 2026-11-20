import { describe, expect, it } from "vitest"

import {
  fieldErrors,
  formatPlate,
  generateCmtId,
  generateTagCode,
  isCmtId,
  isTagCode,
  maskPlate,
  MAX_MESSAGE_LENGTH,
  messageSchema,
  normalizeCmtId,
  normalizeMobile,
  normalizePlate,
  normalizeTagCode,
  ownerInputSchema,
  reasonMessage,
  startChatSchema,
  vehicleInputSchema,
  vehicleLabel,
  vehiclePatchSchema,
} from "./index"

describe("Carmitra IDs", () => {
  it("generates IDs and sticker codes in the right shape", () => {
    for (let i = 0; i < 200; i++) {
      expect(isCmtId(generateCmtId())).toBe(true)
      expect(isTagCode(generateTagCode())).toBe(true)
    }
  })

  it("reads an ID however it is typed", () => {
    expect(normalizeCmtId("cmt-7k2m-94")).toBe("CMT-7K2M-94")
    expect(normalizeCmtId("7K2M94")).toBe("CMT-7K2M-94")
    expect(normalizeCmtId(" CMT 7K2M 94 ")).toBe("CMT-7K2M-94")
  })

  it("refuses IDs with the wrong length or a character that is never used", () => {
    expect(normalizeCmtId("CMT-7K2M-9")).toBeNull()
    expect(normalizeCmtId("CMT-7K2M-90")).toBeNull() // 0 is not in the alphabet
    expect(normalizeCmtId("CMT-IK2M-94")).toBeNull() // nor is I
  })

  it("reads a sticker code typed in, or taken from the sticker's link", () => {
    expect(normalizeTagCode("ct-7k2m-94xq")).toBe("CT-7K2M-94XQ")
    expect(normalizeTagCode("https://carmitra.wesafeqr.com/t/CT-7K2M-94XQ?x=1")).toBe("CT-7K2M-94XQ")
    expect(normalizeTagCode("CT-7K2M-94X")).toBeNull()
  })
})

describe("registration numbers", () => {
  it("accepts the standard format, however it is spaced", () => {
    expect(normalizePlate("mh 12 ab 1234")).toBe("MH12AB1234")
    expect(normalizePlate("MH-12-AB-1234")).toBe("MH12AB1234")
    expect(normalizePlate("DL3CAB1234")).toBe("DL3CAB1234")
    expect(normalizePlate("KA01A1234")).toBe("KA01A1234")
    expect(normalizePlate("GJ011234")).toBe("GJ011234")
  })

  it("accepts the BH series", () => {
    expect(normalizePlate("22 bh 1234 aa")).toBe("22BH1234AA")
    expect(normalizePlate("23BH5678B")).toBe("23BH5678B")
  })

  it("refuses anything else", () => {
    expect(normalizePlate("")).toBeNull()
    expect(normalizePlate("HELLO")).toBeNull()
    expect(normalizePlate("MH12AB123")).toBeNull()
    expect(normalizePlate("M12AB1234")).toBeNull()
    expect(normalizePlate("22BH1234")).toBeNull()
  })

  it("writes a plate the way it appears on the vehicle", () => {
    expect(formatPlate("MH12AB1234")).toBe("MH 12 AB 1234")
    expect(formatPlate("DL3CAB1234")).toBe("DL 3 CAB 1234")
    expect(formatPlate("GJ011234")).toBe("GJ 01 1234")
    expect(formatPlate("22BH1234AA")).toBe("22 BH 1234 AA")
  })

  it("shows only the state and the last four digits on a scan page", () => {
    expect(maskPlate("MH12AB1234")).toBe("MH •• 1234")
    expect(maskPlate("DL3CAB4821")).toBe("DL •• 4821")
    expect(maskPlate("22BH1234AA")).toBe("BH •• 1234")
    expect(maskPlate("nonsense")).toBe("••••")
  })
})

describe("vehicles", () => {
  it("writes the reason as a message about that kind of vehicle", () => {
    expect(reasonMessage("blocking", "car")).toBe("Your car is blocking mine. Could you move it?")
    expect(reasonMessage("lights", "bike")).toBe("The lights on your bike are on.")
    expect(reasonMessage("other", "other")).toBe("I need to speak to you about your vehicle.")
  })

  it("names a vehicle from its colour and model, or its type", () => {
    expect(vehicleLabel({ type: "car", model: "Honda City", colour: "White" })).toBe("White Honda City")
    expect(vehicleLabel({ type: "car", model: "", colour: "Red" })).toBe("Red")
    expect(vehicleLabel({ type: "bike", model: "", colour: "" })).toBe("Bike or scooter")
  })
})

describe("mobile numbers", () => {
  it("reads Indian mobiles however they are typed", () => {
    expect(normalizeMobile("98765 43210")).toBe("+919876543210")
    expect(normalizeMobile("+91-9876543210")).toBe("+919876543210")
    expect(normalizeMobile("09876543210")).toBe("+919876543210")
  })

  it("refuses numbers that aren't Indian mobiles", () => {
    expect(normalizeMobile("12345")).toBeNull()
    expect(normalizeMobile("5876543210")).toBeNull()
  })
})

describe("vehicle input", () => {
  const base = { type: "car", plate: "mh 12 ab 1234", model: "Honda City", colour: "White", contactMode: "chat" }

  it("accepts a vehicle and stores the plate without spaces", () => {
    const result = vehicleInputSchema.parse(base)
    expect(result).toMatchObject({ plate: "MH12AB1234", contactMode: "chat", noteForVisitors: "", numberConsent: false })
  })

  it("needs the owner's say-so to show their number", () => {
    const refused = vehicleInputSchema.safeParse({ ...base, contactMode: "number" })
    expect(refused.success).toBe(false)
    expect(refused.success ? {} : fieldErrors(refused.error)).toHaveProperty("numberConsent")
    expect(vehicleInputSchema.safeParse({ ...base, contactMode: "number", numberConsent: true }).success).toBe(true)
  })

  it("refuses a bad plate, an unknown colour and a long note", () => {
    const result = vehicleInputSchema.safeParse({ ...base, plate: "hello", colour: "Pink", noteForVisitors: "x".repeat(201) })
    const errors = result.success ? {} : fieldErrors(result.error)
    expect(Object.keys(errors).sort()).toEqual(["colour", "noteForVisitors", "plate"])
  })

  it("lets an edit change only some fields, with the same consent rule", () => {
    expect(vehiclePatchSchema.parse({ noteForVisitors: " Back at 6 " })).toEqual({ noteForVisitors: "Back at 6" })
    expect(vehiclePatchSchema.safeParse({ contactMode: "number" }).success).toBe(false)
  })
})

describe("chat and owner input", () => {
  it("trims messages and refuses empty or long ones", () => {
    expect(messageSchema.parse({ text: "  On my way  " }).text).toBe("On my way")
    expect(messageSchema.safeParse({ text: "   " }).success).toBe(false)
    expect(messageSchema.safeParse({ text: "x".repeat(MAX_MESSAGE_LENGTH + 1) }).success).toBe(false)
  })

  it("needs a known reason to start a chat", () => {
    expect(startChatSchema.parse({ cmtId: "CMT-7K2M-94", reason: "lights" })).toEqual({ cmtId: "CMT-7K2M-94", reason: "lights", text: "" })
    expect(startChatSchema.safeParse({ cmtId: "CMT-7K2M-94", reason: "bored" }).success).toBe(false)
  })

  it("needs the consent tick and a valid mobile for the owner", () => {
    const owner = { name: "Asha Rao", mobile: "98765 43210", city: "Pune", consent: { accepted: true } }
    expect(ownerInputSchema.parse(owner).mobile).toBe("+919876543210")
    expect(ownerInputSchema.safeParse({ ...owner, consent: { accepted: false } }).success).toBe(false)
    expect(ownerInputSchema.safeParse({ ...owner, mobile: "123" }).success).toBe(false)
  })
})
