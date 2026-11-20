import { EyeOff, Phone } from "lucide-react"

import { formatPlate, vehicleLabel, type VehicleProfile } from "@carmitra/shared"

import { Wordmark } from "@/components/brand/Wordmark"
import { cn, scanUrl } from "@/lib/utils"

import { Plate } from "./Plate"
import { QrCode } from "./QrCode"

type VehicleCardProps = {
  profile: Pick<VehicleProfile, "cmtId" | "type" | "model" | "colour" | "contactMode">
  /** The full registration number. Only the owner sees this card. */
  plate: string
  /** Where the QR leads, when it isn't this vehicle's own scan page. */
  qrValue?: string
  className?: string
}

/** The owner's card for one vehicle: its plate, its Carmitra ID and its QR. */
export function VehicleCard({ profile, plate, qrValue, className }: VehicleCardProps) {
  const hidden = profile.contactMode === "chat"
  return (
    <article aria-label={`Carmitra card for ${formatPlate(plate)}`} className={cn("print-area overflow-hidden rounded-card border-2 border-navy-900 bg-white text-navy-900 shadow-float", className)}>
      <div className="flex items-center justify-between bg-navy-900 px-5 pb-10 pt-3">
        <Wordmark onDark />
        <span className="label-caps text-xs text-brand-400">Vehicle card</span>
      </div>
      <div className="-mt-7 flex flex-col items-center gap-1 px-5 pb-5 text-center">
        <Plate text={formatPlate(plate)} className="text-[1.4rem] shadow-hard-sm" />
        <p className="mt-2 text-sm text-ink-600">{vehicleLabel(profile)}</p>
        <p className="label-caps mt-1 rounded-md bg-brand-100 px-3 py-1 text-base text-navy-900">{profile.cmtId}</p>
        <QrCode value={qrValue ?? scanUrl(profile.cmtId)} label={`QR code for ${formatPlate(plate)}`} className="mt-3 w-36 rounded-xl border-2 border-navy-900 bg-white p-1.5" />
        <p className={cn("mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold", hidden ? "bg-brand-100 text-brand-600" : "bg-surface text-navy-800")}>
          {hidden ? <EyeOff className="size-4" aria-hidden="true" /> : <Phone className="size-4" aria-hidden="true" />}
          {hidden ? "Number hidden: chat only" : "Number shown to scanners"}
        </p>
      </div>
    </article>
  )
}
