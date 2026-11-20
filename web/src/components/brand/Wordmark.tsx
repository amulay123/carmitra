import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

/** The name, with its second half on a green plate. A text wordmark until there is a logo. */
export function Wordmark({ className, onDark, to = "/" }: { className?: string; onDark?: boolean; to?: string }) {
  return (
    <Link
      to={to}
      aria-label="Carmitra home"
      className={cn("inline-flex min-h-11 items-center gap-[0.16em] font-display text-[1.35rem] font-black uppercase leading-none tracking-tight [font-stretch:76%]", onDark ? "text-white" : "text-navy-900", className)}
    >
      Car
      <span className="rounded-[0.2em] border-[0.09em] border-navy-900 bg-brand-400 px-[0.2em] pb-[0.06em] pt-[0.1em] text-navy-900">mitra</span>
    </Link>
  )
}
