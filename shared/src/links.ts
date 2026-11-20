import { localMobile } from "./phone"

export const scanPath = (cmtId: string) => `/v/${cmtId}`
export const tagPath = (code: string) => `/t/${code}`
export const roomPath = (roomKey: string) => `/c/${roomKey}`

export const telLink = (mobile: string) => `tel:${mobile}`

/** The national emergency number. */
export const EMERGENCY_TEL = "tel:112"

export const whatsappLink = (mobile: string, message: string) =>
  `https://wa.me/91${localMobile(mobile)}?text=${encodeURIComponent(message)}`

/** The ready-written WhatsApp message, when the owner shows their number. */
export const scanMessage = (reason: string, cmtId: string) => `Hi, I scanned the Carmitra QR on your vehicle (${cmtId}). ${reason}`
