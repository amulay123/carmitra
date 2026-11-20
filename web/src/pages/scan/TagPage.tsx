import { doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { normalizeTagCode, type CarTag } from "@carmitra/shared"

import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { PageSkeleton } from "@/components/ui/feedback"
import { db } from "@/lib/firebase"
import { useTitle } from "@/lib/utils"

import { UnknownSticker, VehicleScan } from "./ScanPage"

/** A pre-printed sticker: its vehicle's page once linked, or an offer to link it. */
export function TagPage() {
  useTitle("Carmitra sticker")
  const { code = "" } = useParams()
  const normalized = normalizeTagCode(code)
  const [tag, setTag] = useState<CarTag | null | undefined>(normalized ? undefined : null)

  useEffect(() => {
    if (!normalized) return
    let alive = true
    getDoc(doc(db, "carTags", normalized))
      .then((snap) => alive && setTag(snap.exists() ? (snap.data() as CarTag) : null))
      .catch(() => alive && setTag(null))
    return () => {
      alive = false
    }
  }, [normalized])

  if (tag === undefined) return <PageSkeleton />
  if (!tag || !normalized) return <UnknownSticker />
  if (tag.claimed && tag.cmtId) return <VehicleScan cmtId={tag.cmtId} tagCode={normalized} />

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <Wordmark />
      <h1 className="display text-5xl">This sticker isn't linked to a vehicle yet</h1>
      <p className="text-ink-600">
        If it's yours, link it to your vehicle. Sticker code <span className="font-bold text-navy-800">{normalized}</span>
      </p>
      <Link to={`/app/link-sticker?code=${normalized}`} className={buttonVariants({ size: "lg" })}>
        Link this sticker
      </Link>
    </main>
  )
}
