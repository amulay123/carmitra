import { localMobile } from "@carmitra/shared"

import { config } from "../config"

const GATEWAY = "https://wts.vision360solutions.co.in/api/sendText"

export type Notify = (mobile: string, message: string) => Promise<void>

/** The gateway WeSafe uses. A failed alert must never fail the chat, so errors are only logged. */
export const sendWhatsApp: Notify = async (mobile, message) => {
  if (!config.whatsappToken) return
  const params = new URLSearchParams({ token: config.whatsappToken, phone: `91${localMobile(mobile)}`, message })
  try {
    const res = await fetch(`${GATEWAY}?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) console.error(`WhatsApp gateway answered ${res.status}`)
  } catch (err) {
    console.error("WhatsApp alert failed:", err instanceof Error ? err.message : err)
  }
}
