import { Camera, X } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { formatPlate, normalizeTagCode } from "@carmitra/shared"

import { Button, buttonVariants } from "@/components/ui/button"
import { Notice, PageHeading } from "@/components/ui/feedback"
import { SelectField, TextField } from "@/components/ui/fields"
import { useOwnerData } from "@/data/OwnerData"
import { api, failureMessage } from "@/lib/api"
import { useTitle } from "@/lib/utils"

const READER_ID = "sticker-reader"

function StickerScanner({ onCode, onError }: { onCode: (text: string) => void; onError: (message: string) => void }) {
  const handlers = useRef({ onCode, onError })
  useEffect(() => {
    handlers.current = { onCode, onError }
  })

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false
    void import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (cancelled) return
        const reader = new Html5Qrcode(READER_ID)
        const started = reader.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => handlers.current.onCode(text), () => undefined)
        stop = () => void started.then(() => reader.stop()).then(() => reader.clear()).catch(() => undefined)
        await started
        if (cancelled) stop()
      })
      .catch(() => handlers.current.onError("We couldn't open the camera. Please type the code instead."))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return <div id={READER_ID} className="overflow-hidden rounded-card border-2 border-navy-900 bg-navy-900" />
}

export function LinkStickerPage() {
  useTitle("Link a sticker")
  const { vehicles, refresh } = useOwnerData()
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get("code") ?? "")
  const [cmtId, setCmtId] = useState(params.get("vehicle") ?? vehicles[0]?.profile.cmtId ?? "")
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [linked, setLinked] = useState<{ code: string; cmtId: string } | null>(null)

  const normalized = normalizeTagCode(code)

  if (!vehicles.length) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <PageHeading title="Link a sticker" lead="Add your vehicle first, then we'll link the sticker to it." />
        <Link to={`/app/vehicles/new${normalized ? `?tag=${normalized}` : ""}`} className={buttonVariants({ size: "lg" })}>
          Add your vehicle
        </Link>
      </div>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!normalized) {
      setError("Enter the code printed on the sticker, like CT-7K2M-94XQ.")
      return
    }
    setBusy(true)
    setError("")
    try {
      await api(`/tags/${normalized}/claim`, { body: { cmtId } })
      await refresh()
      setLinked({ code: normalized, cmtId })
      setCode("")
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const linkedVehicle = vehicles.find((v) => v.profile.cmtId === linked?.cmtId)

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex max-w-xl flex-col gap-5">
      <PageHeading title="Link a sticker" lead="Have a pre-printed Carmitra sticker? Link it to your vehicle and it starts working straight away." />

      {linked && linkedVehicle && (
        <Notice tone="success">
          Sticker {linked.code} is now linked to {formatPlate(linkedVehicle.details.plate)}.{" "}
          <Link to={`/app/vehicles/${linked.cmtId}`} className="font-bold underline">
            View the vehicle
          </Link>
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      {scanning ? (
        <div className="flex flex-col gap-2">
          <StickerScanner
            onCode={(text) => {
              const found = normalizeTagCode(text)
              if (!found) return
              setCode(found)
              setScanning(false)
            }}
            onError={(message) => {
              setError(message)
              setScanning(false)
            }}
          />
          <Button variant="ghost" onClick={() => setScanning(false)}>
            <X className="size-4" aria-hidden="true" />
            Close the camera
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="lg" onClick={() => setScanning(true)}>
          <Camera className="size-5" aria-hidden="true" />
          Scan the sticker
        </Button>
      )}

      <TextField id="sticker-code" label="Sticker code" placeholder="CT-7K2M-94XQ" autoCapitalize="characters" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} hint="Printed on the sticker, under the QR." />

      <SelectField id="sticker-vehicle" label="Link it to" value={cmtId} onChange={(e) => setCmtId(e.target.value)}>
        {vehicles.map(({ profile, details }) => (
          <option key={profile.cmtId} value={profile.cmtId}>
            {formatPlate(details.plate)} ({profile.cmtId})
          </option>
        ))}
      </SelectField>

      <Button type="submit" size="lg" busy={busy}>
        Link this sticker
      </Button>
    </form>
  )
}
