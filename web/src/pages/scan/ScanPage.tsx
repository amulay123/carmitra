import { doc, getDoc } from "firebase/firestore"
import { Eye, MessageSquareLock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { normalizeCmtId, roomPath, roomStorageKey, type ReasonId, type VehicleProfile } from "@carmitra/shared"

import { useAuth } from "@/auth/AuthProvider"
import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/feedback"
import { ScanView } from "@/components/vehicle/ScanView"
import { api, failureMessage } from "@/lib/api"
import { db } from "@/lib/firebase"
import { stored, useTitle } from "@/lib/utils"

export function UnknownSticker() {
  useTitle("Sticker not recognised")
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <Wordmark />
      <h1 className="display text-5xl">We don't recognise this sticker</h1>
      <p className="text-ink-600">Check the code printed under the QR, or try scanning it again. If the vehicle was sold, its owner may have removed it.</p>
    </main>
  )
}

async function isOwnVehicle(cmtId: string): Promise<boolean> {
  try {
    // The rules let only the owner read this record.
    return (await getDoc(doc(db, "carVehicles", cmtId, "private", "details"))).exists()
  } catch {
    return false
  }
}

/** The page someone sees when they scan a vehicle's QR. */
export function VehicleScan({ cmtId, tagCode }: { cmtId: string; tagCode?: string }) {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<VehicleProfile | null | undefined>(undefined)
  const [own, setOwn] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [error, setError] = useState("")
  const recorded = useRef(false)
  const [openRoom] = useState(() => stored.get(roomStorageKey(cmtId)))

  useTitle(profile ? `Reach the owner of ${profile.plateMasked}` : "Carmitra")

  useEffect(() => {
    let alive = true
    getDoc(doc(db, "carVehicles", cmtId))
      .then((snap) => alive && setProfile(snap.exists() ? (snap.data() as VehicleProfile) : null))
      .catch(() => alive && setProfile(null))
    return () => {
      alive = false
    }
  }, [cmtId])

  // The scan is recorded once the page opens, unless it is the owner looking at their own vehicle.
  useEffect(() => {
    if (authLoading || !profile || recorded.current) return
    recorded.current = true
    void (async () => {
      if (user && (await isOwnVehicle(cmtId))) {
        setOwn(true)
        return
      }
      await api("/scans", { body: { cmtId, via: tagCode ? "tag" : "id", tagCode } })
    })().catch(() => undefined)
  }, [authLoading, profile, user, cmtId, tagCode])

  const notify = async (reason: ReasonId) => {
    setNotifying(true)
    setError("")
    try {
      const { roomKey } = await api<{ roomKey: string }>("/rooms", { body: { cmtId, reason } })
      stored.set(roomStorageKey(cmtId), roomKey)
      navigate(roomPath(roomKey))
    } catch (err) {
      setError(failureMessage(err))
      setNotifying(false)
    }
  }

  if (profile === undefined) return <PageSkeleton />
  if (profile === null) return <UnknownSticker />

  return (
    <main className="min-h-dvh bg-surface sm:py-8">
      <div className="mx-auto max-w-md overflow-hidden bg-white sm:rounded-card sm:border-2 sm:border-navy-900 sm:shadow-hard">
        {own && (
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-navy-900 bg-brand-100 px-4 py-3 text-sm font-semibold text-navy-800">
            <Eye className="size-4 text-brand-700" aria-hidden="true" />
            <span className="flex-1">This is what a scanner sees. Your visit isn't recorded.</span>
            <Link to={`/app/vehicles/${cmtId}`} className={buttonVariants({ size: "sm", variant: "ghost" })}>
              Back to my vehicle
            </Link>
          </div>
        )}
        {openRoom && !own && (
          <Link to={roomPath(openRoom)} className="flex items-center gap-2 border-b-2 border-navy-900 bg-sky-100 px-4 py-3 text-sm font-semibold text-navy-900 hover:bg-sky-200">
            <MessageSquareLock className="size-4" aria-hidden="true" />
            <span className="flex-1">You've already messaged this owner.</span>
            <span className="label-caps text-xs underline">Open the chat</span>
          </Link>
        )}
        <ScanView profile={profile} onNotify={(reason) => void notify(reason)} notifying={notifying} error={error} preview={own} />
      </div>
    </main>
  )
}

export function ScanPage() {
  const { cmtId = "" } = useParams()
  const id = normalizeCmtId(cmtId)
  return id ? <VehicleScan cmtId={id} /> : <UnknownSticker />
}
