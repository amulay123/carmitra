import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { CheckCheck, SendHorizontal, ShieldCheck } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"

import { MAX_MESSAGE_LENGTH, SAFETY_NOTE, type ChatMessage } from "@carmitra/shared"

import { Button } from "@/components/ui/button"
import { Notice } from "@/components/ui/feedback"
import { failureMessage } from "@/lib/api"
import { db } from "@/lib/firebase"
import { cn, timeAgo } from "@/lib/utils"

type ChatThreadProps = {
  roomKey: string
  /** Whose screen this is: their messages sit on the right. */
  viewer: "visitor" | "owner"
  onSend: (text: string) => Promise<void>
  /** Why nothing more can be written, when the chat has closed. */
  closedText?: string
  /** Shown under the last message the viewer sent, once the other side has read it. */
  seenAt?: string | null
  quickReplies?: readonly string[]
  /** Keeps the box to write in clear of a bar fixed along the bottom of the screen. */
  composerClassName?: string
}

/** The messages of one chat, live, and the box to write in. Used by both sides. */
export function ChatThread({ roomKey, viewer, onSend, closedText, seenAt, quickReplies = [], composerClassName }: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "carChatRooms", roomKey, "carMessages"), orderBy("createdAt")),
        (snap) => setMessages(snap.docs.map((d) => d.data() as ChatMessage)),
        () => setLoadError("We couldn't load this chat. Please refresh the page."),
      ),
    [roomKey],
  )

  const count = messages?.length ?? 0
  useEffect(() => {
    if (count) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [count])

  const send = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError("")
    try {
      await onSend(trimmed)
      setText("")
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(text)
  }

  // Enter sends; Shift+Enter starts a new line.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(text)
    }
  }

  const lastOwn = messages ? messages.map((m) => m.from).lastIndexOf(viewer) : -1
  const seen = Boolean(seenAt && lastOwn >= 0 && messages && seenAt >= messages[lastOwn]!.createdAt)

  return (
    <div className="flex flex-col gap-4">
      {loadError && <Notice tone="error">{loadError}</Notice>}

      <ol aria-label="Messages" aria-live="polite" className="flex flex-col gap-2">
        {messages?.map((message, i) => {
          const own = message.from === viewer
          return (
            <li key={message.id} className={cn("flex max-w-[85%] flex-col gap-1", own ? "items-end self-end" : "items-start self-start")}>
              <p
                className={cn(
                  "whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[15px] leading-snug [overflow-wrap:anywhere]",
                  own ? "rounded-br-md bg-navy-900 text-white" : "rounded-bl-md border-2 border-navy-900/15 bg-white text-navy-900",
                )}
              >
                {message.text}
              </p>
              <span className="px-1 text-xs text-ink-500">
                <span className="sr-only">{own ? "You" : viewer === "owner" ? "Them" : "Owner"}, </span>
                {timeAgo(message.createdAt)}
                {i === lastOwn && seen && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-brand-600">
                    <CheckCheck className="size-3.5" aria-hidden="true" />
                    Seen
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      <div ref={endRef} />

      {closedText ? (
        <Notice tone="info">{closedText}</Notice>
      ) : (
        <form onSubmit={submit} className={cn("sticky bottom-0 -mx-4 flex flex-col gap-2 border-t-2 border-navy-900/10 bg-surface/95 px-4 pb-3 pt-3 backdrop-blur", composerClassName)}>
          {quickReplies.length > 0 && (
            <div className="snap-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(reply)}
                  className="min-h-10 shrink-0 rounded-full border-2 border-navy-900/25 bg-white px-3.5 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-900 disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex items-end gap-2">
            <label htmlFor="chat-message" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-message"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              className="max-h-36 min-h-12 flex-1 resize-none rounded-field border-2 border-navy-900/25 bg-white px-3.5 py-2.5 text-base text-navy-900 [field-sizing:content] placeholder:text-ink-500 focus:border-navy-900 focus:outline-none"
            />
            <Button type="submit" size="md" busy={busy} disabled={!text.trim()} aria-label="Send" className="px-4">
              {!busy && <SendHorizontal className="size-5" aria-hidden="true" />}
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <ShieldCheck className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            {SAFETY_NOTE}
          </p>
        </form>
      )}
    </div>
  )
}
