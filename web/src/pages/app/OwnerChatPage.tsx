import { ArrowLeft, Ban, CircleX } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { QUICK_REPLIES, reasonLabel } from "@carmitra/shared"

import { ChatThread } from "@/components/chat/ChatThread"
import { Button } from "@/components/ui/button"
import { ErrorPanel, Notice } from "@/components/ui/feedback"
import { chatIsOpen, useOwnerData } from "@/data/OwnerData"
import { api, failureMessage } from "@/lib/api"
import { formatDateTime, useTitle } from "@/lib/utils"

/** The owner's side of a chat. Opening it tells the visitor it has been seen. */
export function OwnerChatPage() {
  const { chatId = "" } = useParams()
  const { chats } = useOwnerData()
  const chat = chats.find((c) => c.chatId === chatId)
  useTitle(chat ? `Chat about ${chat.plateMasked}` : "Chat")
  const [asking, setAsking] = useState<"close" | "block" | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const unread = chat?.unreadForOwner ?? 0
  useEffect(() => {
    if (unread > 0) void api(`/chats/${chatId}/read`, { body: {} }).catch(() => undefined)
  }, [chatId, unread])

  if (!chat) return <ErrorPanel message="This chat isn't on your account. It may have been deleted after 30 days." />

  const open = chatIsOpen(chat)
  const closedText =
    chat.status === "blocked"
      ? "You blocked this person. They can't start a new chat about this vehicle for 30 days."
      : chat.status === "closed"
        ? "You closed this chat."
        : !open
          ? "This chat closed 24 hours after it started. If they need you again, they can scan the sticker."
          : undefined

  const act = async (action: "close" | "block") => {
    setBusy(true)
    setError("")
    try {
      await api(`/chats/${chatId}/${action}`, { body: {} })
      setAsking(null)
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex flex-col gap-3 border-b-2 border-navy-900/15 pb-4">
        <Link to="/app/inbox" className="label-caps inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] text-ink-600 hover:text-navy-900">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Inbox
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="label-caps rounded-md border-2 border-navy-900 bg-brand-400 px-2.5 py-1 text-sm">{chat.plateMasked}</span>
          <h1 className="text-2xl font-extrabold">{reasonLabel(chat.reason)}</h1>
        </div>
        <p className="text-sm text-ink-600">
          About your {chat.vehicleLabel}. Started {formatDateTime(chat.createdAt)}. They can't see your number, and you can't see theirs.
        </p>
        {open && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAsking("close")}>
              <CircleX className="size-4" aria-hidden="true" />
              Close chat
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAsking("block")} className="text-coral-700">
              <Ban className="size-4" aria-hidden="true" />
              Block
            </Button>
          </div>
        )}
        {asking && (
          <div className="flex flex-col gap-2 rounded-card border-2 border-navy-900 bg-white p-4">
            <p className="font-bold">{asking === "close" ? "Close this chat? They won't be able to write any more." : "Block this person? The chat closes, and they can't start another about this vehicle for 30 days."}</p>
            <div className="flex flex-wrap gap-2">
              <Button busy={busy} onClick={() => void act(asking)} className={asking === "block" ? "border-coral-700 bg-coral-600 text-white hover:bg-coral-700" : undefined}>
                {asking === "close" ? "Close chat" : "Block"}
              </Button>
              <Button variant="ghost" onClick={() => setAsking(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </header>

      <ChatThread
        roomKey={chat.roomKey}
        viewer="owner"
        closedText={closedText}
        quickReplies={QUICK_REPLIES}
        composerClassName="bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0"
        onSend={async (text) => {
          await api(`/chats/${chatId}/messages`, { body: { text } })
        }}
      />
    </div>
  )
}
