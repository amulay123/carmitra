import { cn } from "@/lib/utils"

import { QrCode } from "./QrCode"

/**
 * The sticker as it is printed: the QR, what to do with it, and the Carmitra ID. It carries
 * no personal details. Size it with a font size.
 */
export function StickerArt({ cmtId, qrValue, className }: { cmtId: string; qrValue: string; className?: string }) {
  return (
    <div className={cn("flex aspect-square flex-col items-center justify-between overflow-hidden rounded-[11%] border-[0.24em] border-navy-900 bg-brand-400 text-center text-navy-900 shadow-float", className)}>
      <p className="display px-[6%] pt-[7%] text-[1.9em]">
        Scan to reach
        <br />
        the owner
      </p>
      <QrCode value={qrValue} label="Sample Carmitra QR code" className="w-[52%] rounded-[9%] border-[0.2em] border-navy-900 bg-white p-[2.5%]" />
      <p className="label-caps flex w-full items-center justify-between bg-navy-900 px-[7%] py-[4.5%] text-[0.78em] text-white">
        <span>
          Car<span className="text-brand-400">mitra</span>
        </span>
        <span className="text-brand-400">{cmtId}</span>
      </p>
    </div>
  )
}
