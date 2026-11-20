import { scanUrl } from "@/lib/utils"

import { qrDataUrl } from "./QrCode"

export async function downloadQr(cmtId: string) {
  const link = document.createElement("a")
  link.href = await qrDataUrl(scanUrl(cmtId), 1024)
  link.download = `${cmtId}-qr.png`
  link.click()
}
