import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import type { CarChat, CarScan, MeResponse, VehiclePrivate, VehicleProfile } from "@carmitra/shared"

import { useAuth } from "@/auth/AuthProvider"
import { ErrorPanel, PageSkeleton } from "@/components/ui/feedback"
import { api, failureMessage } from "@/lib/api"
import { db } from "@/lib/firebase"

export type OwnedVehicle = { profile: VehicleProfile; details: VehiclePrivate }

type OwnerData = MeResponse & {
  uid: string
  vehicles: OwnedVehicle[]
  /** Newest first. Live: they update as they happen. */
  scans: CarScan[]
  /** Open chats first, then newest first. Live. */
  chats: CarChat[]
  unreadChats: number
  unreadScans: number
  refresh: () => Promise<void>
}

const OwnerContext = createContext<OwnerData | null>(null)

async function loadVehicles(uid: string): Promise<OwnedVehicle[]> {
  const index = await getDocs(collection(db, "carOwners", uid, "vehicles"))
  const vehicles = await Promise.all(
    index.docs.map(async ({ id }) => {
      const [profile, details] = await Promise.all([getDoc(doc(db, "carVehicles", id)), getDoc(doc(db, "carVehicles", id, "private", "details"))])
      return profile.exists() && details.exists() ? { profile: profile.data() as VehicleProfile, details: details.data() as VehiclePrivate } : null
    }),
  )
  return vehicles.filter((vehicle) => vehicle !== null).sort((a, b) => a.profile.createdAt.localeCompare(b.profile.createdAt))
}

type Loaded = MeResponse & { vehicles: OwnedVehicle[] }

const loadAll = async (uid: string): Promise<Loaded> => {
  const [me, vehicles] = await Promise.all([api<MeResponse>("/me"), loadVehicles(uid)])
  return { ...me, vehicles }
}

const isOpen = (chat: CarChat) => chat.status === "open" && Date.parse(chat.closesAt) > Date.now()

/** Everything the owner's app shows, loaded once per sign-in. Scans and chats stay live. */
export function OwnerDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user!.uid
  const [data, setData] = useState<Loaded | null>(null)
  const [scans, setScans] = useState<CarScan[] | null>(null)
  const [chats, setChats] = useState<CarChat[] | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const refresh = useCallback(async () => setData(await loadAll(uid)), [uid])

  useEffect(() => {
    let alive = true
    loadAll(uid)
      .then((loaded) => {
        if (!alive) return
        setData(loaded)
        setError("")
      })
      .catch((err) => alive && setError(failureMessage(err)))
    return () => {
      alive = false
    }
  }, [uid, attempt])

  // Sorted here: sorting in the query would need new indexes on WeSafe's project.
  useEffect(() => {
    const failed = () => setError("We couldn't load your inbox. Please try again.")
    const stopScans = onSnapshot(
      query(collection(db, "carScans"), where("ownerUid", "==", uid)),
      (snap) =>
        setScans(
          snap.docs
            .map((d) => d.data() as CarScan)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 100),
        ),
      failed,
    )
    const stopChats = onSnapshot(
      query(collection(db, "carChats"), where("ownerUid", "==", uid)),
      (snap) =>
        setChats(
          snap.docs
            .map((d) => d.data() as CarChat)
            .sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || b.lastMessageAt.localeCompare(a.lastMessageAt)),
        ),
      failed,
    )
    return () => {
      stopScans()
      stopChats()
    }
  }, [uid, attempt])

  const value = useMemo<OwnerData | null>(
    () =>
      data && scans && chats
        ? {
            ...data,
            uid,
            scans,
            chats,
            refresh,
            unreadChats: chats.filter((chat) => chat.unreadForOwner > 0).length,
            unreadScans: scans.filter((scan) => !scan.read).length,
          }
        : null,
    [data, scans, chats, uid, refresh],
  )

  if (error && !value) return <ErrorPanel message={error} onRetry={() => setAttempt((n) => n + 1)} />
  if (!value) return <PageSkeleton />
  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>
}

export function useOwnerData() {
  const value = useContext(OwnerContext)
  if (!value) throw new Error("useOwnerData must be used inside OwnerDataProvider")
  return value
}

export const chatIsOpen = isOpen
