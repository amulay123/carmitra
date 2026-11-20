import { EyeOff, Phone, Plus } from "lucide-react"
import { Link, Navigate } from "react-router-dom"

import { formatPlate, vehicleLabel } from "@carmitra/shared"

import { ChatRow } from "@/components/chat/Rows"
import { buttonVariants } from "@/components/ui/button"
import { PageHeading } from "@/components/ui/feedback"
import { Plate } from "@/components/vehicle/Plate"
import { paintForColour, VehicleArt } from "@/components/vehicle/VehicleArt"
import { artFor } from "@/components/vehicle/VehicleFields"
import { useOwnerData, type OwnedVehicle } from "@/data/OwnerData"
import { cn, useTitle } from "@/lib/utils"

export function ModeChip({ hidden, className }: { hidden: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold", hidden ? "bg-brand-100 text-brand-700" : "bg-salmon-100 text-navy-900", className)}>
      {hidden ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Phone className="size-3.5" aria-hidden="true" />}
      {hidden ? "Chat only" : "Number shown"}
    </span>
  )
}

function VehicleCardLink({ vehicle: { profile, details }, unread }: { vehicle: OwnedVehicle; unread: number }) {
  const kind = artFor[profile.type]
  return (
    <Link to={`/app/vehicles/${profile.cmtId}`} className="group flex flex-col overflow-hidden rounded-card border-2 border-navy-900 bg-white shadow-hard-sm transition-transform hover:-translate-y-0.5">
      <div className="relative flex h-36 items-end justify-center bg-sky-100 px-5 pb-3">
        <VehicleArt kind={kind} paint={paintForColour[profile.colour] ?? "green"} className={cn("transition-transform duration-500 group-hover:-translate-x-2", kind === "scooter" ? "w-[34%]" : "w-[62%]")} />
        {unread > 0 && <span className="label-caps absolute right-3 top-3 rounded-md bg-coral-500 px-2 py-1 text-[11px] text-white">{unread} new</span>}
      </div>
      <div className="flex flex-col gap-2 border-t-2 border-navy-900 p-4">
        <Plate text={formatPlate(details.plate)} className="self-start text-[1.3rem]" />
        <p className="font-bold">{vehicleLabel(profile)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <ModeChip hidden={profile.contactMode === "chat"} />
          <span className="text-xs font-semibold text-ink-500">{profile.cmtId}</span>
        </div>
      </div>
    </Link>
  )
}

export function VehiclesPage() {
  useTitle("My vehicles")
  const { vehicles, chats } = useOwnerData()
  if (!vehicles.length) return <Navigate to="/app/vehicles/new" replace />

  const latest = chats.slice(0, 3)
  const unreadFor = (cmtId: string) => chats.filter((chat) => chat.cmtId === cmtId && chat.unreadForOwner > 0).length

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="My vehicles"
        action={
          <Link to="/app/vehicles/new" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Plus className="size-4" aria-hidden="true" />
            Add a vehicle
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCardLink key={vehicle.profile.cmtId} vehicle={vehicle} unread={unreadFor(vehicle.profile.cmtId)} />
        ))}
      </div>

      <section aria-labelledby="latest-messages" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="latest-messages" className="text-2xl font-extrabold">
            Latest messages
          </h2>
          {chats.length > 0 && (
            <Link to="/app/inbox" className="label-caps inline-flex min-h-11 items-center text-[13px] text-brand-700 hover:underline">
              Open inbox
            </Link>
          )}
        </div>
        {latest.length ? (
          <ul className="flex flex-col gap-2.5">
            {latest.map((chat) => (
              <ChatRow key={chat.chatId} chat={chat} />
            ))}
          </ul>
        ) : (
          <p className="text-ink-600">When someone scans your sticker and sends a message, it shows here, and you get a WhatsApp alert.</p>
        )}
      </section>
    </div>
  )
}
