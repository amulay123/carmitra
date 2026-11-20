import { useState } from "react"

import { fieldErrors, formatMobile, localMobile, normalizeMobile, ownerInputSchema, type CarOwner, type OwnerPrefill } from "@carmitra/shared"

import { MobileField, TextField } from "@/components/ui/fields"

export type OwnerFormValues = { name: string; mobile: string; city: string }

export function ownerFormFrom(owner: CarOwner | null, prefill: OwnerPrefill): OwnerFormValues {
  const mobile = owner?.mobile || prefill.mobile
  return { name: owner?.name || prefill.name, mobile: mobile ? localMobile(mobile) : "", city: owner?.city || prefill.city }
}

/** Validates the details for saving. `accepted` is the consent tick. */
export function checkOwnerForm(values: OwnerFormValues, accepted: boolean) {
  const result = ownerInputSchema.safeParse({ ...values, consent: { accepted } })
  return result.success ? { ok: true as const, body: { ...values, consent: { accepted: true as const } } } : { ok: false as const, errors: fieldErrors(result.error) }
}

export function useOwnerForm(initial: OwnerFormValues) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const change = (patch: Partial<OwnerFormValues>) => {
    setValues((v) => ({ ...v, ...patch }))
    setErrors({})
  }
  return { values, errors, setErrors, change }
}

type OwnerFieldsProps = {
  values: OwnerFormValues
  errors: Record<string, string>
  mobileLocked: boolean
  onChange: (patch: Partial<OwnerFormValues>) => void
}

export function OwnerFields({ values, errors, mobileLocked, onChange }: OwnerFieldsProps) {
  const normalized = normalizeMobile(values.mobile)
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField id="owner-name" label="Your name" autoComplete="name" maxLength={60} value={values.name} onChange={(e) => onChange({ name: e.target.value })} error={errors.name} />
      <TextField id="owner-city" label="City" autoComplete="address-level2" maxLength={60} value={values.city} onChange={(e) => onChange({ city: e.target.value })} error={errors.city} />
      <div className="sm:col-span-2">
        <MobileField
          id="owner-mobile"
          label="Mobile number"
          value={values.mobile}
          disabled={mobileLocked}
          onChange={(mobile) => onChange({ mobile })}
          error={errors.mobile}
          hint={mobileLocked && normalized ? `Verified when you signed in: ${formatMobile(normalized)}. WhatsApp alerts go here.` : "WhatsApp alerts go to this number."}
        />
      </div>
    </div>
  )
}
