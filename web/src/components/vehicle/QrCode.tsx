import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export async function qrDataUrl(value: string, width: number): Promise<string> {
  const { toDataURL } = await import("qrcode")
  return toDataURL(value, { width, margin: 1, errorCorrectionLevel: "M", color: { dark: "#0d1b2e", light: "#ffffff" } })
}

export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let alive = true
    void qrDataUrl(value, 420).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [value])

  return <div className={cn("aspect-square bg-surface", className)}>{src && <img src={src} alt={label} className="size-full" />}</div>
}
