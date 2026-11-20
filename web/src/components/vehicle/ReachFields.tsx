import { EyeOff, Phone } from "lucide-react"

import { fieldErrors, formatMobile, MAX_NOTE_LENGTH, reachSchema, type ContactMode } from "@carmitra/shared"

import { CheckRow, FieldError, TextAreaField } from "@/components/ui/fields"
import { cn } from "@/lib/utils"

export type ReachForm = { contactMode: ContactMode; numberConsent: boolean; noteForVisitors: string }

export const defaultReach: ReachForm = { contactMode: "chat", numberConsent: false, noteForVisitors: "" }

export function checkReach(values: ReachForm) {
  const result = reachSchema.safeParse(values)
  return result.success ? { ok: true as const, value: result.data } : { ok: false as const, errors: fieldErrors(result.error) }
}

const choices = [
  {
    mode: "chat" as const,
    icon: EyeOff,
    title: "Chat only",
    tag: "Recommended",
    text: "People message you from the page they scanned. Your number never appears.",
  },
  {
    mode: "number" as const,
    icon: Phone,
    title: "Show my number",
    tag: "",
    text: "Call and WhatsApp buttons appear, and the private chat stays too.",
  },
]

type ReachFieldsProps = {
  values: ReachForm
  errors: Record<string, string>
  onChange: (patch: Partial<ReachForm>) => void
  /** The number that would be shown, so the owner knows exactly what they agree to. */
  mobile: string
  /** The note field is left out where it is edited separately. */
  withNote?: boolean
}

export function ReachFields({ values, errors, onChange, mobile, withNote = true }: ReachFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-bold text-navy-800">How should people reach you?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map(({ mode, icon: Icon, title, tag, text }) => {
            const selected = values.contactMode === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ contactMode: mode, numberConsent: mode === "number" ? values.numberConsent : false })}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-card border-2 p-4 text-left transition",
                  selected ? "border-navy-900 bg-white shadow-hard-sm" : "border-navy-900/25 bg-white/60 hover:border-navy-900",
                )}
              >
                <span className="flex w-full items-center gap-2">
                  <span className={cn("grid size-9 place-items-center rounded-lg", selected ? "bg-navy-900 text-brand-400" : "bg-surface text-navy-800")}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-xl font-extrabold [font-stretch:88%]">{title}</span>
                  {tag && <span className="label-caps ml-auto rounded-md bg-brand-100 px-2 py-0.5 text-[10px] text-brand-700">{tag}</span>}
                </span>
                <span className="text-sm leading-snug text-ink-600">{text}</span>
              </button>
            )
          })}
        </div>
        <FieldError>{errors.contactMode}</FieldError>
      </fieldset>

      {values.contactMode === "number" && (
        <CheckRow id="number-consent" checked={values.numberConsent} onChange={(numberConsent) => onChange({ numberConsent })} error={errors.numberConsent}>
          <strong className="text-navy-900">Show {mobile ? formatMobile(mobile) : "my number"} on this vehicle's page.</strong> Anyone who scans the sticker can see it and call it.
        </CheckRow>
      )}

      {withNote && (
        <TextAreaField
          id="note-for-visitors"
          label="A note for people who scan (optional)"
          maxLength={MAX_NOTE_LENGTH}
          placeholder="I'm usually in the office opposite."
          value={values.noteForVisitors}
          onChange={(e) => onChange({ noteForVisitors: e.target.value })}
          error={errors.noteForVisitors}
          hint="Shown on the scan page. Please don't put your number here."
        />
      )}
    </div>
  )
}
