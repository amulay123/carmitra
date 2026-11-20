import { Car, MessagesSquare, QrCode, Settings, Sticker, type LucideIcon } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"

import { Wordmark } from "@/components/brand/Wordmark"
import { useOwnerData } from "@/data/OwnerData"
import { cn } from "@/lib/utils"

const items: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/app", label: "Vehicles", icon: Car, end: true },
  { to: "/app/inbox", label: "Inbox", icon: MessagesSquare },
  { to: "/app/link-sticker", label: "Link sticker", icon: QrCode },
  { to: "/app/get-sticker", label: "Get sticker", icon: Sticker },
  { to: "/app/settings", label: "Settings", icon: Settings },
]

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="grid min-w-5 place-items-center rounded-full border-2 border-surface bg-coral-500 px-1 text-[11px] font-bold leading-4 text-white">
      {count > 9 ? "9+" : count}
      <span className="sr-only"> new</span>
    </span>
  )
}

/** The owner's app: a bar along the top on a computer, along the bottom on a phone. */
export function AppLayout() {
  const { unreadChats, unreadScans } = useOwnerData()
  const unread = unreadChats + unreadScans
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b-2 border-navy-900 bg-surface/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Wordmark to="/app" />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => cn("label-caps inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] transition-colors", isActive ? "bg-navy-900 text-brand-400" : "text-navy-800 hover:bg-navy-900/10")}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
                {to === "/app/inbox" && <Badge count={unread} />}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-12">
        <Outlet />
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t-2 border-navy-900 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden print:hidden">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-bold", isActive ? "text-navy-900" : "text-ink-500")}>
            {({ isActive }) => (
              <>
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", isActive && "bg-brand-400")}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
                {to === "/app/inbox" && unread > 0 && (
                  <span className="absolute left-1/2 top-1 ml-2">
                    <Badge count={unread} />
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
