import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { fieldErrors, formatPlate, localMobile, stickerOrderSchema } from "@carmitra/shared"

import { Button, buttonVariants } from "@/components/ui/button"
import { Notice, PageHeading } from "@/components/ui/feedback"
import { MobileField, SelectField, TextField } from "@/components/ui/fields"
import { useOwnerData } from "@/data/OwnerData"
import { api, failureMessage } from "@/lib/api"
import { focusFirstError, useTitle } from "@/lib/utils"

/** A request for a printed, weatherproof sticker. There is no payment yet: the team gets in touch. */
export function GetStickerPage() {
  useTitle("Get a sticker")
  const { vehicles, owner, prefill } = useOwnerData()
  const [params] = useSearchParams()
  const mobile = owner?.mobile || prefill.mobile
  const [form, setForm] = useState({
    cmtId: params.get("vehicle") ?? vehicles[0]?.profile.cmtId ?? "",
    name: owner?.name || prefill.name,
    mobile: mobile ? localMobile(mobile) : "",
    line1: "",
    line2: "",
    city: owner?.city || prefill.city,
    state: "",
    pin: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const vehicle = vehicles.find((v) => v.profile.cmtId === form.cmtId)

  if (!vehicles.length) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <PageHeading title="Get a sticker" lead="Add your vehicle first, then request its sticker." />
        <Link to="/app/vehicles/new" className={buttonVariants({ size: "lg" })}>
          Add your vehicle
        </Link>
      </div>
    )
  }

  if (done && vehicle) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <PageHeading title="Request received" lead={`We have your request for a sticker for ${formatPlate(vehicle.details.plate)}, and will contact you on your mobile about delivery.`} />
        <Link to={`/app/vehicles/${form.cmtId}`} className={buttonVariants()}>
          Back to the vehicle
        </Link>
      </div>
    )
  }

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors({})
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const result = stickerOrderSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      focusFirstError()
      return
    }
    setBusy(true)
    setError("")
    try {
      await api("/sticker-orders", { body: form })
      setDone(true)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex max-w-xl flex-col gap-4">
      <PageHeading title="Get a printed sticker" lead="A weatherproof Carmitra sticker for your windscreen or bike, delivered to you." />
      {error && <Notice tone="error">{error}</Notice>}

      <SelectField id="order-vehicle" label="For" value={form.cmtId} onChange={(e) => set("cmtId")(e.target.value)} error={errors.cmtId}>
        {vehicles.map(({ profile, details }) => (
          <option key={profile.cmtId} value={profile.cmtId}>
            {formatPlate(details.plate)}
          </option>
        ))}
      </SelectField>
      <TextField id="order-name" label="Recipient's name" autoComplete="name" value={form.name} onChange={(e) => set("name")(e.target.value)} error={errors.name} />
      <MobileField id="order-mobile" label="Recipient's mobile" value={form.mobile} onChange={set("mobile")} error={errors.mobile} />
      <TextField id="order-line1" label="House, street and area" autoComplete="address-line1" value={form.line1} onChange={(e) => set("line1")(e.target.value)} error={errors.line1} />
      <TextField id="order-line2" label="Landmark (optional)" autoComplete="address-line2" value={form.line2} onChange={(e) => set("line2")(e.target.value)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField id="order-city" label="City" autoComplete="address-level2" value={form.city} onChange={(e) => set("city")(e.target.value)} error={errors.city} />
        <TextField id="order-state" label="State" autoComplete="address-level1" value={form.state} onChange={(e) => set("state")(e.target.value)} error={errors.state} />
        <TextField id="order-pin" label="PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={form.pin} onChange={(e) => set("pin")(e.target.value.replace(/\D/g, ""))} error={errors.pin} />
      </div>
      <Button type="submit" size="lg" busy={busy} className="self-start">
        Request the sticker
      </Button>
    </form>
  )
}
