import { ChevronRight, ScanLine } from "lucide-react"
import { Link } from "react-router-dom"

import { reasonLabel, type CarChat, type CarScan } from "@carmitra/shared"

import { chatIsOpen } from "@/data/OwnerData"
import { cn, timeAgo } from "@/lib/utils"

const statusText = (chat: CarChat) => (chat.status === "blocked" ? "Blocked" : chatIsOpen(chat) ? null : "Closed")

/** One chat in a list: the vehicle, why they wrote, the last message. */
export function ChatRow({ chat }: { chat: CarChat }) {
  const status = statusText(chat)
  const unread = chat.unreadForOwner > 0
  return (
    <li>
      <Link to={`/app/chats/${chat.chatId}`} className={cn("group flex items-start gap-3 rounded-card border-2 p-3.5 transition", unread ? "border-navy-900 bg-white shadow-hard-sm" : "border-navy-900/15 bg-white/70 hover:border-navy-900")}>
        <span className={cn("label-caps mt-0.5 shrink-0 rounded-md border-2 border-navy-900 px-2 py-1 text-[11px]", unread ? "bg-brand-400" : "bg-white")}>{chat.plateMasked}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate", unread ? "font-extrabold" : "font-bold")}>{reasonLabel(chat.reason)}</span>
            <span className="shrink-0 text-xs text-ink-500">{timeAgo(chat.lastMessageAt)}</span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-ink-600">
            {chat.lastFrom === "owner" && "You: "}
            {chat.lastMessage}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-500">{chat.vehicleLabel}</span>
            {status && <span className="label-caps rounded bg-surface px-1.5 py-0.5 text-[10px] text-ink-600">{status}</span>}
            {unread && <span className="label-caps rounded bg-coral-500 px-1.5 py-0.5 text-[10px] text-white">{chat.unreadForOwner} new</span>}
          </span>
        </span>
        <ChevronRight className="mt-1 size-5 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  )
}

/** A scan with no message: someone opened the vehicle's page. */
export function ScanRow({ scan, fresh }: { scan: CarScan; fresh?: boolean }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border-2", fresh ? "border-navy-900 bg-brand-400 text-navy-900" : "border-navy-900/15 bg-white text-ink-500")}>
        <ScanLine className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {scan.vehicleLabel} ({scan.plateMasked}) was scanned
        </p>
        <p className="text-sm text-ink-500">
          {timeAgo(scan.createdAt)}
          {scan.via === "tag" && ` · from sticker ${scan.tagCode}`}
        </p>
      </div>
    </li>
  )
}
