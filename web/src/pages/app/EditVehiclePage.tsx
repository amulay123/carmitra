import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { formatPlate, type Colour } from "@carmitra/shared"

import { Button, buttonVariants } from "@/components/ui/button"
import { ErrorPanel, Notice, PageHeading } from "@/components/ui/feedback"
import { checkDetails, useDetailsForm, VehicleFields, VehiclePreview } from "@/components/vehicle/VehicleFields"
import { useOwnerData, type OwnedVehicle } from "@/data/OwnerData"
import { api, failureFields, failureMessage } from "@/lib/api"
import { focusFirstError, useTitle } from "@/lib/utils"

function EditForm({ vehicle }: { vehicle: OwnedVehicle }) {
  const { refresh } = useOwnerData()
  const navigate = useNavigate()
  const { profile, details } = vehicle
  const form = useDetailsForm({ type: profile.type, plate: formatPlate(details.plate), model: profile.model, colour: profile.colour as Colour | "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const check = checkDetails(form.values)
    if (!check.ok) {
      form.setErrors(check.errors)
      focusFirstError()
      return
    }
    setBusy(true)
    setError("")
    try {
      await api(`/vehicles/${profile.cmtId}`, { method: "PATCH", body: check.value })
      await refresh()
      navigate(`/app/vehicles/${profile.cmtId}`)
    } catch (err) {
      form.setErrors(failureFields(err))
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
      <div className="flex flex-col gap-5">
        <PageHeading title="Edit vehicle" lead="Its QR and Carmitra ID stay the same." />
        {error && <Notice tone="error">{error}</Notice>}
        <VehicleFields values={form.values} errors={form.errors} onChange={form.change} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" busy={busy}>
            Save changes
          </Button>
          <Link to={`/app/vehicles/${profile.cmtId}`} className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Cancel
          </Link>
        </div>
      </div>
      <VehiclePreview values={form.values} className="lg:sticky lg:top-24" />
    </form>
  )
}

export function EditVehiclePage() {
  useTitle("Edit vehicle")
  const { cmtId } = useParams()
  const { vehicles } = useOwnerData()
  const vehicle = vehicles.find((v) => v.profile.cmtId === cmtId)
  if (!vehicle) return <ErrorPanel message="This vehicle isn't on your account." />
  return <EditForm vehicle={vehicle} />
}
