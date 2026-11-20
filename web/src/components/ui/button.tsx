import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/** Buttons are plates: an outline, a hard shadow, and a press that pushes them into it. */
export const buttonVariants = cva(
  "label-caps inline-flex max-w-full items-center justify-center gap-2 rounded-control border-2 text-center transition duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "border-navy-900 bg-brand-400 text-navy-900 shadow-hard-sm hover:bg-brand-300",
        secondary: "border-navy-900 bg-white text-navy-900 shadow-hard-sm hover:bg-brand-100",
        ink: "border-navy-900 bg-navy-900 text-white shadow-[3px_3px_0_var(--color-brand-400)] hover:bg-navy-700",
        /* On a navy block, where a dark outline and shadow would disappear. */
        onDark: "border-brand-400 bg-brand-400 text-navy-900 shadow-hard-light hover:border-white hover:bg-white",
        outline: "border-white/70 text-white hover:bg-white hover:text-navy-900",
        ghost: "border-transparent text-navy-900 hover:bg-navy-900/10",
      },
      size: {
        sm: "min-h-11 px-4 py-2 text-[13px]",
        md: "min-h-12 px-5 py-2.5 text-sm",
        lg: "min-h-14 px-7 py-3 text-[15px]",
      },
      full: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { busy?: boolean }

export function Button({ className, variant, size, full, busy, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || busy} className={cn(buttonVariants({ variant, size, full }), className)} {...props}>
      {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
