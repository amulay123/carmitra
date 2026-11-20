import { useEffect, useRef, useState } from "react"

import { ChatRow, ScanRow } from "@/components/chat/Rows"
import { PageHeading } from "@/components/ui/feedback"
import { useOwnerData } from "@/data/OwnerData"
import { api } from "@/lib/api"
import { useTitle } from "@/lib/utils"

export function InboxPage() {
  useTitle("Inbox")
  const { chats, scans, unreadScans } = useOwnerData()
  // Kept from the first render, so what was new stays highlighted while it is being read.
  const [newOnArrival] = useState(() => new Set(scans.filter((scan) => !scan.read).map((scan) => scan.id)))
  const marked = useRef(false)

  useEffect(() => {
    if (!unreadScans || marked.current) return
    marked.current = true
    void api("/scans/mark-read", { body: {} }).catch(() => undefined)
  }, [unreadScans])

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PageHeading title="Inbox" lead="Messages from people at your vehicles, and every scan." />

      <section aria-labelledby="messages" className="flex flex-col gap-3">
        <h2 id="messages" className="text-2xl font-extrabold">
          Messages
        </h2>
        {chats.length ? (
          <ul className="flex flex-col gap-2.5">
            {chats.map((chat) => (
              <ChatRow key={chat.chatId} chat={chat} />
            ))}
          </ul>
        ) : (
          <p className="text-ink-600">No messages yet. When someone at your vehicle writes, you get a WhatsApp alert and the chat shows here.</p>
        )}
      </section>

      <section aria-labelledby="scans" className="flex flex-col gap-1">
        <h2 id="scans" className="text-2xl font-extrabold">
          Scans
        </h2>
        <p className="text-sm text-ink-600">Someone opened your vehicle's page. A scan on its own doesn't send an alert.</p>
        {scans.length ? (
          <ul className="divide-y-2 divide-navy-900/10">
            {scans.map((scan) => (
              <ScanRow key={scan.id} scan={scan} fresh={newOnArrival.has(scan.id)} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-600">No scans yet.</p>
        )}
      </section>
    </div>
  )
}
