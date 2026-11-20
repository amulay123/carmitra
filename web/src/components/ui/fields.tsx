import { Check } from "lucide-react"
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

const labelClass = "text-sm font-bold text-navy-800"
const controlClass =
  "min-h-12 w-full rounded-field border-2 border-navy-900/25 bg-white px-3.5 py-2.5 text-base text-navy-900 transition-colors placeholder:text-ink-500 hover:border-navy-900/50 focus:border-navy-900 focus:outline-none disabled:bg-surface disabled:text-ink-600 aria-invalid:border-coral-600"

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} className="text-sm font-semibold text-coral-700">
      {children}
    </p>
  )
}

type FieldShell = { id: string; label: string; error?: string; hint?: ReactNode }

function Shell({ id, label, error, hint, children }: FieldShell & { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-ink-500">{hint}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

const described = (id: string, error?: string) => (error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {})

export function TextField({ id, label, error, hint, className, ...props }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <input id={id} className={cn(controlClass, className)} {...described(id, error)} {...props} />
    </Shell>
  )
}

export function SelectField({ id, label, error, hint, children, ...props }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <select id={id} className={controlClass} {...described(id, error)} {...props}>
        {children}
      </select>
    </Shell>
  )
}

export function TextAreaField({ id, label, error, hint, ...props }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <textarea id={id} rows={3} className={controlClass} {...described(id, error)} {...props} />
    </Shell>
  )
}

export function MobileField({ id, label, error, hint, value, onChange, disabled }: FieldShell & { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="flex gap-2">
        <span className="flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-field border-2 border-navy-900/25 bg-surface px-3 font-semibold text-ink-600">+91</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit number"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={controlClass}
          {...described(id, error)}
        />
      </div>
    </Shell>
  )
}

type ChipOption<T> = { value: T; label: string; icon?: ReactNode }

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  options: ChipOption<T>[]
  value: T | ""
  onChange: (value: T) => void
  error?: string
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className={cn(labelClass, "mb-1.5")}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option.value} selected={value === option.value} onClick={() => onChange(option.value)}>
            {option.icon}
            {option.label}
          </Chip>
        ))}
      </div>
      <FieldError>{error}</FieldError>
    </fieldset>
  )
}

export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-field border-2 px-4 py-2 text-sm font-bold transition-colors disabled:opacity-45",
        selected ? "border-navy-900 bg-navy-900 text-white" : "border-navy-900/25 bg-white text-navy-800 hover:border-navy-900",
      )}
    >
      {children}
    </button>
  )
}

export function CheckRow({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-ink-600">
        <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={error ? true : undefined}
            className="peer size-6 appearance-none rounded-md border-2 border-navy-900/40 bg-white checked:border-navy-900 checked:bg-navy-900 aria-invalid:border-coral-600"
          />
          <Check className="pointer-events-none absolute size-4 text-brand-400 opacity-0 peer-checked:opacity-100" strokeWidth={3.5} aria-hidden="true" />
        </span>
        <span>{children}</span>
      </label>
      <FieldError>{error}</FieldError>
    </div>
  )
}
