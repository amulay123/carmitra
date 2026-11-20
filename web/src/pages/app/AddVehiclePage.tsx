import { ArrowLeft, Download, Eye, Printer, QrCode, Sticker } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { normalizeMobile, normalizeTagCode, scanPath } from "@carmitra/shared"

import { Button, buttonVariants } from "@/components/ui/button"
import { Notice } from "@/components/ui/feedback"
import { CheckRow } from "@/components/ui/fields"
import { downloadQr } from "@/components/vehicle/downloadQr"
import { checkOwnerForm, OwnerFields, ownerFormFrom, useOwnerForm } from "@/components/vehicle/OwnerFields"
import { checkReach, defaultReach, ReachFields, type ReachForm } from "@/components/vehicle/ReachFields"
import { StickerArt } from "@/components/vehicle/StickerArt"
import { checkDetails, emptyDetails, useDetailsForm, VehicleFields, VehiclePreview } from "@/components/vehicle/VehicleFields"
import { useOwnerData } from "@/data/OwnerData"
import { api, failureFields, failureMessage } from "@/lib/api"
import { cn, focusFirstError, scanUrl, useTitle } from "@/lib/utils"

type Step = "vehicle" | "reach" | "owner" | "done"

function Steps({ steps, current }: { steps: { id: Step; label: string }[]; current: Step }) {
  const at = steps.findIndex((step) => step.id === current)
  return (
    <ol aria-label="Steps" className="flex gap-2">
      {steps.map((step, i) => (
        <li key={step.id} aria-current={i === at ? "step" : undefined} className="flex flex-1 flex-col gap-1.5">
          <span className={cn("h-1.5 rounded-full", i <= at ? "bg-navy-900" : "bg-navy-900/15")} />
          <span className={cn("label-caps text-[11px]", i === at ? "text-navy-900" : "text-ink-500")}>
            {i + 1}. {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** Add a vehicle: its details, how people reach the owner, the owner's own details once, then the QR. */
export function AddVehiclePage() {
  useTitle("Add a vehicle")
  const { owner, prefill, refresh } = useOwnerData()
  const [params] = useSearchParams()
  const tagCode = normalizeTagCode(params.get("tag") ?? "")
  // Decided once: saving the owner's details part-way must not change the steps.
  const [needsOwner] = useState(() => !owner)

  const [step, setStep] = useState<Step>("vehicle")
  const details = useDetailsForm(emptyDetails)
  const [reach, setReach] = useState<ReachForm>(defaultReach)
  const [reachErrors, setReachErrors] = useState<Record<string, string>>({})
  const ownerForm = useOwnerForm(ownerFormFrom(owner, prefill))
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [created, setCreated] = useState<{ cmtId: string; tagLinked: boolean } | null>(null)

  const steps: { id: Step; label: string }[] = [
    { id: "vehicle", label: "Vehicle" },
    { id: "reach", label: "Reach you" },
    ...(needsOwner ? [{ id: "owner" as const, label: "Your details" }] : []),
    { id: "done", label: "QR" },
  ]

  const mobileShown = normalizeMobile(owner?.mobile ?? ownerForm.values.mobile) ?? ""

  const go = (next: Step) => {
    setError("")
    setStep(next)
    window.scrollTo(0, 0)
  }

  const create = async () => {
    setBusy(true)
    setError("")
    try {
      if (needsOwner) {
        const check = checkOwnerForm(ownerForm.values, accepted)
        if (!check.ok) {
          ownerForm.setErrors(check.errors)
          focusFirstError()
          return
        }
        await api("/me", { method: "PUT", body: check.body })
      }
      const { cmtId } = await api<{ cmtId: string }>("/vehicles", { body: { ...details.values, ...reach } })
      let tagLinked = false
      if (tagCode) {
        tagLinked = await api(`/tags/${tagCode}/claim`, { body: { cmtId } }).then(
          () => true,
          () => false,
        )
      }
      await refresh()
      setCreated({ cmtId, tagLinked })
      go("done")
    } catch (err) {
      const fields = failureFields(err)
      if (fields.plate || fields.type || fields.colour) {
        details.setErrors(fields)
        go("vehicle")
      }
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (step === "vehicle") {
      const check = checkDetails(details.values)
      if (!check.ok) {
        details.setErrors(check.errors)
        focusFirstError()
        return
      }
      go("reach")
      return
    }
    if (step === "reach") {
      const check = checkReach(reach)
      if (!check.ok) {
        setReachErrors(check.errors)
        focusFirstError()
        return
      }
      if (needsOwner) go("owner")
      else void create()
      return
    }
    if (step === "owner") void create()
  }

  if (step === "done" && created) {
    const qr = scanUrl(created.cmtId)
    return (
      <div className="flex flex-col gap-6">
        <Steps steps={steps} current="done" />
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <StickerArt cmtId={created.cmtId} qrValue={qr} className="print-area w-full text-[15px]" />
            <div className="grid grid-cols-2 gap-2.5 print:hidden">
              <Button variant="secondary" onClick={() => void downloadQr(created.cmtId)}>
                <Download className="size-4" aria-hidden="true" />
                Save QR
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden="true" />
                Print
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4 print:hidden">
            <h1 className="display text-6xl">Your QR is ready.</h1>
            <p className="max-w-[48ch] text-ink-600">
              Carmitra ID <strong className="text-navy-900">{created.cmtId}</strong>. Print the sticker and put it on the inside of the windscreen, or anywhere on a bike where it can be scanned.
            </p>
            {created.tagLinked && <Notice tone="success">Your pre-printed sticker {tagCode} is linked to this vehicle and works now.</Notice>}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link to={`/app/vehicles/${created.cmtId}`} className={buttonVariants({ size: "lg" })}>
                Go to my vehicle
              </Link>
              <Link to={scanPath(created.cmtId)} className={buttonVariants({ variant: "secondary", size: "lg" })}>
                <Eye className="size-4" aria-hidden="true" />
                See what a scanner sees
              </Link>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Link to={`/app/link-sticker?vehicle=${created.cmtId}`} className="flex items-start gap-3 rounded-card border-2 border-navy-900/20 bg-white p-4 hover:border-navy-900">
                <QrCode className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block font-bold">Have a pre-printed sticker?</span>
                  <span className="text-sm text-ink-600">Link it to this vehicle.</span>
                </span>
              </Link>
              <Link to={`/app/get-sticker?vehicle=${created.cmtId}`} className="flex items-start gap-3 rounded-card border-2 border-navy-900/20 bg-white p-4 hover:border-navy-900">
                <Sticker className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block font-bold">Want a printed sticker?</span>
                  <span className="text-sm text-ink-600">Request one, delivered to you.</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const back = step === "reach" ? "vehicle" : step === "owner" ? "reach" : null

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Steps steps={steps} current={step} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex flex-col gap-5">
          <header>
            <h1 className="display text-5xl md:text-6xl">
              {step === "vehicle" && "Add your vehicle"}
              {step === "reach" && "How should people reach you?"}
              {step === "owner" && "Your details"}
            </h1>
            <p className="mt-2 max-w-[56ch] text-ink-600">
              {step === "vehicle" && "No documents needed. You can change any of this later."}
              {step === "reach" && "You can switch between these at any time, and the sticker keeps working."}
              {step === "owner" && "Once only. WhatsApp alerts go to your mobile."}
            </p>
          </header>
          {tagCode && step === "vehicle" && <Notice>We'll link your sticker {tagCode} to this vehicle.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}

          {step === "vehicle" && <VehicleFields values={details.values} errors={details.errors} onChange={details.change} />}
          {step === "reach" && (
            <ReachFields
              values={reach}
              errors={reachErrors}
              mobile={mobileShown}
              onChange={(patch) => {
                setReach((r) => ({ ...r, ...patch }))
                setReachErrors({})
              }}
            />
          )}
          {step === "owner" && (
            <>
              <OwnerFields values={ownerForm.values} errors={ownerForm.errors} mobileLocked={prefill.mobileLocked} onChange={ownerForm.change} />
              <CheckRow id="consent" checked={accepted} onChange={setAccepted} error={ownerForm.errors["consent.accepted"]}>
                I agree to Carmitra using my details to run this service: showing my vehicle's page to people who scan it, and sending me alerts on WhatsApp.
              </CheckRow>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {back && (
              <Button variant="ghost" onClick={() => go(back)}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </Button>
            )}
            <Button type="submit" size="lg" busy={busy}>
              {step === "vehicle" ? "Next" : step === "reach" && needsOwner ? "Next" : "Get my QR"}
            </Button>
          </div>
        </div>
        <VehiclePreview values={details.values} className={cn("order-first lg:sticky lg:top-24 lg:order-none", step !== "vehicle" && "hidden lg:flex")} compact />
      </div>
    </form>
  )
}
