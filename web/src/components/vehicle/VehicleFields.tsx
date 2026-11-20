import { Bike, Car, Truck } from "lucide-react"
import { useState } from "react"

import { COLOURS, fieldErrors, formatPlate, normalizePlate, vehicleDetailsSchema, vehicleTypeLabel, type Colour, type VehicleType } from "@carmitra/shared"

import { ChipGroup, FieldError, TextField } from "@/components/ui/fields"
import { cn } from "@/lib/utils"

import { Plate } from "./Plate"
import { paintForColour, paints, VehicleArt } from "./VehicleArt"

export type DetailsForm = { type: VehicleType | ""; plate: string; model: string; colour: Colour | "" }

export const emptyDetails: DetailsForm = { type: "", plate: "", model: "", colour: "" }

export function checkDetails(values: DetailsForm) {
  const result = vehicleDetailsSchema.safeParse(values)
  return result.success ? { ok: true as const, value: result.data } : { ok: false as const, errors: fieldErrors(result.error) }
}

export function useDetailsForm(initial: DetailsForm) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const change = (patch: Partial<DetailsForm>) => {
    setValues((v) => ({ ...v, ...patch }))
    setErrors({})
  }
  return { values, errors, setErrors, change }
}

export const artFor = { car: "car", bike: "scooter", other: "suv" } as const

const typeOptions = [
  { value: "car" as const, label: vehicleTypeLabel.car, icon: <Car className="size-4" aria-hidden="true" /> },
  { value: "bike" as const, label: vehicleTypeLabel.bike, icon: <Bike className="size-4" aria-hidden="true" /> },
  { value: "other" as const, label: vehicleTypeLabel.other, icon: <Truck className="size-4" aria-hidden="true" /> },
]

/** The vehicle as the form describes it so far, drawn in its colour with its plate. */
export function VehiclePreview({ values, className, compact }: { values: DetailsForm; className?: string; compact?: boolean }) {
  const plate = normalizePlate(values.plate)
  const kind = artFor[values.type || "car"]
  return (
    <div aria-hidden="true" className={cn("flex flex-col items-center rounded-card border-2 border-navy-900 bg-sky-100", compact ? "gap-3 px-4 py-4 lg:gap-4 lg:px-5 lg:py-6" : "gap-4 px-5 py-6", className)}>
      <VehicleArt
        kind={kind}
        paint={values.colour ? paintForColour[values.colour] : "green"}
        className={cn(kind === "scooter" ? "w-[42%]" : "w-[82%]", compact && (kind === "scooter" ? "max-w-24 lg:max-w-none" : "max-w-56 lg:max-w-none"))}
      />
      <Plate text={plate ? formatPlate(plate) : values.plate.toUpperCase() || "MH 12 AB 1234"} className={cn("shadow-hard-sm", compact ? "text-[1.3rem] lg:text-[1.6rem]" : "text-[1.6rem]", !values.plate && "opacity-40")} />
    </div>
  )
}

type VehicleFieldsProps = {
  values: DetailsForm
  errors: Record<string, string>
  onChange: (patch: Partial<DetailsForm>) => void
}

export function VehicleFields({ values, errors, onChange }: VehicleFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <ChipGroup label="What kind of vehicle?" options={typeOptions} value={values.type} onChange={(type) => onChange({ type })} error={errors.type} />
      <TextField
        id="vehicle-plate"
        label="Registration number"
        placeholder="MH 12 AB 1234"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={16}
        value={values.plate}
        onChange={(e) => onChange({ plate: e.target.value.toUpperCase() })}
        error={errors.plate}
        hint="As it is written on the number plate. People who scan only see the state and the last four digits."
      />
      <TextField id="vehicle-model" label="Make and model (optional)" placeholder="Honda City" maxLength={40} value={values.model} onChange={(e) => onChange({ model: e.target.value })} error={errors.model} />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold text-navy-800">Colour (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {COLOURS.map((colour) => {
            const selected = values.colour === colour
            return (
              <button
                key={colour}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ colour: selected ? "" : colour })}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-field border-2 py-2 pl-2.5 pr-3.5 text-sm font-bold transition-colors",
                  selected ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/25 bg-white text-navy-800 hover:border-navy-900",
                )}
              >
                <span aria-hidden="true" className="size-5 rounded-full border-2 border-navy-900/30" style={{ background: paints[paintForColour[colour]].body }} />
                {colour}
              </button>
            )
          })}
        </div>
        <FieldError>{errors.colour}</FieldError>
      </fieldset>
    </div>
  )
}
