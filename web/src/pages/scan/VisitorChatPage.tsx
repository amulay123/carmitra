import { doc, onSnapshot } from "firebase/firestore"
import { BellRing, CheckCheck, Siren } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { EMERGENCY_TEL, reasonLabel, roomStorageKey, scanPath, type ChatRoom } from "@carmitra/shared"

import { ChatThread } from "@/components/chat/ChatThread"
import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/feedback"
import { Plate } from "@/components/vehicle/Plate"
import { api } from "@/lib/api"
import { db } from "@/lib/firebase"
import { formatDateTime, stored, useNow, useTitle } from "@/lib/utils"

function MissingChat() {
  useTitle("Chat not found")
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <Wordmark />
      <h1 className="display text-5xl">We can't find this chat</h1>
      <p className="text-ink-600">Chats are deleted 30 days after they start. To reach the owner, scan the sticker on the vehicle again.</p>
    </main>
  )
}

/** The person at the vehicle, talking to its owner. The room key in the address is their only way in. */
export function VisitorChatPage() {
  const { roomKey = "" } = useParams()
  const [room, setRoom] = useState<ChatRoom | null | undefined>(undefined)
  const now = useNow()
  useTitle("Private chat")

  useEffect(
    () =>
      onSnapshot(
        doc(db, "carChatRooms", roomKey),
        (snap) => setRoom(snap.exists() ? (snap.data() as ChatRoom) : null),
        () => setRoom(null),
      ),
    [roomKey],
  )

  // Remembered, so scanning the sticker again offers this chat instead of starting another.
  useEffect(() => {
    if (room) stored.set(roomStorageKey(room.cmtId), roomKey)
  }, [room, roomKey])

  if (room === undefined) return <PageSkeleton />
  if (room === null) return <MissingChat />

  const expired = now > Date.parse(room.closesAt)
  const closedText =
    room.status === "blocked" || room.status === "closed"
      ? "The owner has closed this chat."
      : expired
        ? "This chat closed 24 hours after it started. If you still need the owner, scan the sticker again."
        : undefined

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-4 pt-4">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Wordmark />
            <span className="label-caps rounded-md bg-navy-900 px-2 py-1 text-[11px] text-brand-400">Private chat</span>
          </div>
          <div className="flex flex-col gap-3 rounded-card border-2 border-navy-900 bg-white p-4 shadow-hard-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Plate text={room.plateMasked} className="text-[1.3rem]" />
              <span className="font-bold">{room.vehicleLabel}</span>
            </div>
            <p className="text-sm text-ink-600">
              {reasonLabel(room.reason)}. Neither of you sees the other's number. {!closedText && `Open until ${formatDateTime(room.closesAt)}.`}
            </p>
            {!closedText && (
              <p className="flex items-center gap-2 rounded-control bg-brand-100 px-3 py-2 text-sm font-semibold text-navy-900">
                {room.ownerSeenAt ? <CheckCheck className="size-4 text-brand-700" aria-hidden="true" /> : <BellRing className="size-4 text-brand-700" aria-hidden="true" />}
                {room.ownerSeenAt ? "The owner has seen your message." : "The owner has been told on WhatsApp. Keep this page open for their reply."}
              </p>
            )}
          </div>
        </header>

        <ChatThread
          roomKey={roomKey}
          viewer="visitor"
          seenAt={room.ownerSeenAt}
          closedText={closedText}
          onSend={async (text) => {
            await api(`/rooms/${roomKey}/messages`, { body: { text } })
          }}
        />

        <footer className="flex flex-col items-center gap-2 pb-2 pt-2 text-center">
          <a href={EMERGENCY_TEL} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-coral-700">
            <Siren className="size-4" aria-hidden="true" />
            Emergency? Call 112
          </a>
          <Link to={scanPath(room.cmtId)} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Back to the vehicle's page
          </Link>
        </footer>
      </div>
    </main>
  )
}
