import { Download, Eye, Link2, Pencil, Printer, Sticker, Trash2 } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { formatPlate, scanPath, vehicleLabel } from "@carmitra/shared"

import { ChatRow, ScanRow } from "@/components/chat/Rows"
import { Button, buttonVariants } from "@/components/ui/button"
import { ErrorPanel, Notice } from "@/components/ui/feedback"
import { downloadQr } from "@/components/vehicle/downloadQr"
import { Plate } from "@/components/vehicle/Plate"
import { checkReach, ReachFields, type ReachForm } from "@/components/vehicle/ReachFields"
import { StickerArt } from "@/components/vehicle/StickerArt"
import { useOwnerData, type OwnedVehicle } from "@/data/OwnerData"
import { api, failureMessage } from "@/lib/api"
import { focusFirstError, scanUrl, useTitle } from "@/lib/utils"

import { ModeChip } from "./VehiclesPage"

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t-2 border-navy-900/15 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** How people reach the owner, changed in place. The scan page follows straight away. */
function ReachSettings({ vehicle, mobile, onSaved }: { vehicle: OwnedVehicle; mobile: string; onSaved: () => Promise<void> }) {
  const { profile } = vehicle
  const initial: ReachForm = { contactMode: profile.contactMode, numberConsent: profile.contactMode === "number", noteForVisitors: profile.noteForVisitors }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const changed = values.contactMode !== initial.contactMode || values.noteForVisitors.trim() !== initial.noteForVisitors

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const check = checkReach(values)
    if (!check.ok) {
      setErrors(check.errors)
      focusFirstError()
      return
    }
    setBusy(true)
    setError("")
    try {
      await api(`/vehicles/${profile.cmtId}`, { method: "PATCH", body: check.value })
      await onSaved()
      setSaved(true)
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {saved && !changed && <Notice tone="success">Saved. The scan page shows the change now.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <ReachFields
        values={values}
        errors={errors}
        mobile={mobile}
        onChange={(patch) => {
          setValues((v) => ({ ...v, ...patch }))
          setErrors({})
          setSaved(false)
        }}
      />
      {changed && (
        <Button type="submit" busy={busy} className="self-start">
          Save changes
        </Button>
      )}
    </form>
  )
}

function RemoveVehicle({ vehicle }: { vehicle: OwnedVehicle }) {
  const { refresh } = useOwnerData()
  const navigate = useNavigate()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const plate = formatPlate(vehicle.details.plate)

  const remove = async () => {
    setBusy(true)
    setError("")
    try {
      await api(`/vehicles/${vehicle.profile.cmtId}`, { method: "DELETE" })
      await refresh()
      navigate("/app", { replace: true })
    } catch (err) {
      setError(failureMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border-2 border-coral-600/40 bg-coral-50 p-4">
      <p className="text-sm text-navy-800">Sold it, or don't drive it any more? Removing it stops its QR working. Any pre-printed sticker is freed for the next owner, and open chats close.</p>
      {error && <Notice tone="error">{error}</Notice>}
      {asking ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-full font-bold">Remove {plate}? This can't be undone.</p>
          <Button busy={busy} onClick={() => void remove()} className="border-coral-700 bg-coral-600 text-white hover:bg-coral-700">
            Yes, remove it
          </Button>
          <Button variant="ghost" onClick={() => setAsking(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setAsking(true)} className="self-start">
          <Trash2 className="size-4" aria-hidden="true" />
          Remove this vehicle
        </Button>
      )}
    </div>
  )
}

export function VehiclePage() {
  const { cmtId } = useParams()
  const { vehicles, chats, scans, owner, refresh } = useOwnerData()
  const vehicle = vehicles.find((v) => v.profile.cmtId === cmtId)
  useTitle(vehicle ? formatPlate(vehicle.details.plate) : "Vehicle")
  if (!vehicle) return <ErrorPanel message="This vehicle isn't on your account." />

  const { profile, details } = vehicle
  const vehicleChats = chats.filter((chat) => chat.cmtId === profile.cmtId)
  const vehicleScans = scans.filter((scan) => scan.cmtId === profile.cmtId).slice(0, 8)

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3 lg:sticky lg:top-24">
        <StickerArt cmtId={profile.cmtId} qrValue={scanUrl(profile.cmtId)} className="print-area w-full text-[15px]" />
        <div className="grid grid-cols-2 gap-2.5 print:hidden">
          <Button variant="secondary" onClick={() => void downloadQr(profile.cmtId)}>
            <Download className="size-4" aria-hidden="true" />
            Save QR
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
        </div>
        <p className="text-center text-xs text-ink-500 print:hidden">The sticker carries no personal details.</p>
      </div>

      <div className="flex flex-col gap-6 print:hidden">
        <header className="flex flex-col gap-3">
          <Plate text={formatPlate(details.plate)} className="self-start text-[2rem] shadow-hard-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold">{vehicleLabel(profile)}</h1>
            <ModeChip hidden={profile.contactMode === "chat"} />
          </div>
          <p className="text-sm text-ink-600">
            Carmitra ID <strong className="text-navy-900">{profile.cmtId}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={scanPath(profile.cmtId)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Eye className="size-4" aria-hidden="true" />
              See what a scanner sees
            </Link>
            <Link to={`/app/vehicles/${profile.cmtId}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit details
            </Link>
          </div>
        </header>

        <Section title="How people reach you">
          <ReachSettings vehicle={vehicle} mobile={owner?.mobile ?? ""} onSaved={refresh} />
        </Section>

        <Section title="Messages">
          {vehicleChats.length ? (
            <ul className="flex flex-col gap-2.5">
              {vehicleChats.map((chat) => (
                <ChatRow key={chat.chatId} chat={chat} />
              ))}
            </ul>
          ) : (
            <p className="text-ink-600">No messages yet. When someone at your vehicle writes, you get a WhatsApp alert and the chat shows here.</p>
          )}
        </Section>

        <Section
          title="Stickers"
          action={
            <Link to={`/app/link-sticker?vehicle=${profile.cmtId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <Link2 className="size-4" aria-hidden="true" />
              Link a sticker
            </Link>
          }
        >
          {details.tagCodes.length ? (
            <ul className="flex flex-wrap gap-2">
              {details.tagCodes.map((code) => (
                <li key={code} className="label-caps rounded-md border-2 border-navy-900 bg-white px-3 py-1.5 text-sm">
                  {code}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-600">No pre-printed sticker linked. The QR on this page already works.</p>
          )}
          <Link to={`/app/get-sticker?vehicle=${profile.cmtId}`} className={buttonVariants({ variant: "secondary", className: "mt-1 self-start" })}>
            <Sticker className="size-4" aria-hidden="true" />
            Request a printed sticker
          </Link>
        </Section>

        <Section title="Scans">
          {vehicleScans.length ? (
            <ul className="divide-y-2 divide-navy-900/10">
              {vehicleScans.map((scan) => (
                <ScanRow key={scan.id} scan={scan} />
              ))}
            </ul>
          ) : (
            <p className="text-ink-600">Nobody has scanned this vehicle's QR yet.</p>
          )}
        </Section>

        <Section title="Remove">
          <RemoveVehicle vehicle={vehicle} />
        </Section>
      </div>
    </div>
  )
}
