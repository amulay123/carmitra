import { MessageCircle, MessageSquareLock, Phone, Siren } from "lucide-react"
import { useState } from "react"

import { EMERGENCY_TEL, REASONS, reasonMessage, scanMessage, telLink, vehicleLabel, vehicleTypeLabel, whatsappLink, type ReasonId, type VehicleProfile } from "@carmitra/shared"

import { Wordmark } from "@/components/brand/Wordmark"
import { Button, buttonVariants } from "@/components/ui/button"
import { Notice } from "@/components/ui/feedback"
import { cn } from "@/lib/utils"

import { Plate } from "./Plate"
import { paintForColour, VehicleArt } from "./VehicleArt"

const artFor = { car: "car", bike: "scooter", other: "suv" } as const

type ScanViewProps = {
  profile: VehicleProfile
  /** Starts a private chat with the owner, opening with this reason. */
  onNotify?: (reason: ReasonId) => void
  notifying?: boolean
  error?: string
  /** Shown as a sample: nothing is sent and the buttons do nothing. */
  preview?: boolean
  /** The reason already picked, for the sample. */
  reason?: ReasonId
}

/** What someone sees when they scan a vehicle's QR. */
export function ScanView({ profile, onNotify, notifying, error, preview, reason: firstReason }: ScanViewProps) {
  const { cmtId, contact, type } = profile
  const [reason, setReason] = useState<ReasonId | null>(firstReason ?? null)
  const [asked, setAsked] = useState(false)

  const notify = () => {
    if (!reason) setAsked(true)
    else onNotify?.(reason)
  }

  const inert = preview ? { tabIndex: -1, "aria-hidden": true as const, onClick: (e: { preventDefault: () => void }) => e.preventDefault() } : {}
  const message = scanMessage(reasonMessage(reason ?? "other", type), cmtId)

  return (
    <div className="flex flex-col bg-white">
      <div className="relative flex flex-col items-center border-b-2 border-navy-900 bg-sky-200 px-5 pb-5 pt-14">
        <span className="label-caps absolute left-4 top-4 rounded-md bg-navy-900 px-2 py-1 text-[11px] text-brand-400">Vehicle QR</span>
        <span className="absolute right-4 top-2.5">
          <Wordmark className="min-h-8 text-base" to={preview ? "#" : "/"} />
        </span>
        <VehicleArt kind={artFor[type]} paint={paintForColour[profile.colour] ?? "coral"} className={type === "bike" ? "w-[40%]" : "w-[72%]"} />
        <Plate text={profile.plateMasked} className="mt-3 text-[1.6rem] shadow-hard-sm" />
      </div>

      <div className="flex flex-col gap-3 p-5">
        <div>
          <h1 className="display text-[2.7rem]">Need the owner?</h1>
          <p className="mt-1.5 leading-relaxed text-ink-600">Pick what's happening and notify them. They get a WhatsApp alert.</p>
        </div>

        <ul aria-label="About this vehicle" className="flex flex-wrap gap-1.5">
          {[vehicleLabel(profile), vehicleTypeLabel[type]].map((fact) => (
            <li key={fact} className="rounded-md border border-line-strong bg-surface px-2.5 py-1 text-[13px] font-semibold text-navy-800">
              {fact}
            </li>
          ))}
        </ul>

        {profile.noteForVisitors && <p className="rounded-control bg-brand-50 px-4 py-3 text-sm leading-relaxed text-navy-800">{profile.noteForVisitors}</p>}

        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">What's happening?</legend>
          {REASONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={reason === id}
              onClick={preview ? undefined : () => setReason(id)}
              {...(preview ? { tabIndex: -1 } : {})}
              className={cn(
                "min-h-11 rounded-field border-2 px-3 py-2 text-left text-[13px] font-semibold leading-tight transition-colors duration-200",
                reason === id ? "border-navy-900 bg-navy-900 text-brand-400" : "border-line-strong bg-white text-navy-800 hover:border-navy-900",
              )}
            >
              {label}
            </button>
          ))}
        </fieldset>
        {asked && !reason && <Notice tone="warn">Pick what's happening first.</Notice>}

        {contact && (
          <div className="grid grid-cols-2 gap-2.5">
            <a href={telLink(contact.phone)} {...inert} className={buttonVariants({ size: "md" })}>
              <Phone className="size-4" aria-hidden="true" />
              Call
            </a>
            <a href={whatsappLink(contact.phone, message)} {...inert} className={buttonVariants({ variant: "secondary", size: "md" })}>
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        )}

        <Button variant={contact ? "ink" : "primary"} size="lg" full busy={notifying} onClick={preview ? undefined : notify} {...(preview ? { tabIndex: -1, "aria-hidden": true } : {})}>
          <MessageSquareLock className="size-5" aria-hidden="true" />
          {contact ? "Message privately" : "Notify the owner"}
        </Button>

        {error && <Notice tone="error">{error}</Notice>}

        <p className="text-center text-[13px] leading-snug text-ink-500">
          {contact ? "A private message doesn't share your number." : "A private chat opens here. No phone numbers are shared."}
        </p>

        <a href={EMERGENCY_TEL} {...inert} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-coral-700">
          <Siren className="size-4" aria-hidden="true" />
          Emergency? Call 112
        </a>

        <p className="text-center text-[13px] text-ink-500">
          Carmitra ID <span className="font-bold text-navy-800">{cmtId}</span>
        </p>
      </div>
    </div>
  )
}
