import { collection, getDocs, limit, query } from "firebase/firestore"
import { ExternalLink, LogOut } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { useAuth } from "@/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Notice, PageHeading } from "@/components/ui/feedback"
import { checkOwnerForm, OwnerFields, ownerFormFrom, useOwnerForm } from "@/components/vehicle/OwnerFields"
import { useOwnerData } from "@/data/OwnerData"
import { api, failureMessage } from "@/lib/api"
import { db } from "@/lib/firebase"
import { focusFirstError, petSafeUrl, useTitle, weSafeUrl } from "@/lib/utils"

type Family = { weSafe: boolean; pets: number }

/**
 * What else this account has in the WeSafe family. Read with the user's own access, which
 * WeSafe's and PetSafeQR's rules already give them. Hidden if either can't be read.
 */
function useFamily(uid: string): Family | null {
  const [family, setFamily] = useState<Family | null>(null)
  useEffect(() => {
    let alive = true
    Promise.all([getDocs(query(collection(db, "Users", uid, "ChildList"), limit(1))), getDocs(collection(db, "petOwners", uid, "pets"))])
      .then(([children, pets]) => alive && setFamily({ weSafe: !children.empty, pets: pets.size }))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [uid])
  return family
}

function FamilyLink({ href, name, text }: { href: string; name: string; text: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-card border-2 border-navy-900/20 bg-white p-4 transition-colors hover:border-navy-900">
      <span>
        <span className="block font-bold">{name}</span>
        <span className="text-sm text-ink-600">{text}</span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-ink-500 group-hover:text-navy-900" aria-hidden="true" />
    </a>
  )
}

export function SettingsPage() {
  useTitle("Settings")
  const { signOut } = useAuth()
  const { uid, owner, prefill, refresh } = useOwnerData()
  const family = useFamily(uid)
  const form = useOwnerForm(ownerFormFrom(owner, prefill))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    const check = checkOwnerForm(form.values, true)
    if (!check.ok) {
      form.setErrors(check.errors)
      focusFirstError()
      return
    }
    setBusy(true)
    setError("")
    try {
      await api("/me", { method: "PUT", body: check.body })
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(failureMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-5">
        <PageHeading title="Settings" lead="Alerts go to your mobile. Vehicles set to show your number show this one." />
        {saved && <Notice tone="success">Saved.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <OwnerFields values={form.values} errors={form.errors} mobileLocked={prefill.mobileLocked} onChange={form.change} />
        <Button type="submit" size="lg" busy={busy} className="self-start">
          Save changes
        </Button>
      </form>

      <section aria-labelledby="family" className="flex flex-col gap-3 border-t-2 border-navy-900/15 pt-6">
        <h2 id="family" className="text-2xl font-extrabold">
          Your WeSafe family
        </h2>
        <p className="text-sm text-ink-600">The same sign-in works on all of these.</p>
        <div className="grid gap-3">
          <FamilyLink href={weSafeUrl} name="WeSafe QR" text={family?.weSafe ? "You have a WeSafe profile." : "Emergency QR for you and your family."} />
          <FamilyLink href={petSafeUrl} name="PetSafe QR" text={family?.pets ? `${family.pets} ${family.pets === 1 ? "pet" : "pets"} on PetSafe QR.` : "A permanent ID and QR tag for your pet."} />
        </div>
      </section>

      <div className="border-t-2 border-navy-900/15 pt-5">
        <Button variant="ghost" onClick={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
