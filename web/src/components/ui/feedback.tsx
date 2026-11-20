import { CircleCheck, Info, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const tones = {
  info: { box: "bg-sky-50 text-navy-800", icon: Info, iconClass: "text-sky-700" },
  warn: { box: "bg-salmon-100 text-navy-900", icon: TriangleAlert, iconClass: "text-coral-600" },
  error: { box: "bg-coral-50 text-coral-700", icon: TriangleAlert, iconClass: "text-coral-600" },
  success: { box: "bg-brand-100 text-navy-900", icon: CircleCheck, iconClass: "text-brand-600" },
}

export function Notice({ tone = "info", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  const { box, icon: Icon, iconClass } = tones[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-control px-4 py-3 text-sm font-medium leading-relaxed", box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-navy-900/10", className)} />

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-40 w-full rounded-card" />
      <Skeleton className="h-40 w-full rounded-card" />
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">We couldn't load this</h1>
      <p className="text-ink-600">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function PageHeading({ title, lead, action }: { title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold">{title}</h1>
        {lead && <p className="mt-1 max-w-[60ch] text-ink-600">{lead}</p>}
      </div>
      {action}
    </header>
  )
}
