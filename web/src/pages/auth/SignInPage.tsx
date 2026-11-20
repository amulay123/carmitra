import { FirebaseError } from "firebase/app"
import { type FormEvent, useState } from "react"
import { Navigate, useSearchParams } from "react-router-dom"

import { formatMobile, normalizeMobile } from "@carmitra/shared"

import { RECAPTCHA_ID, useAuth } from "@/auth/AuthProvider"
import { Wordmark } from "@/components/brand/Wordmark"
import { Button } from "@/components/ui/button"
import { Notice, PageSkeleton } from "@/components/ui/feedback"
import { MobileField, TextField } from "@/components/ui/fields"
import { VehicleArt } from "@/components/vehicle/VehicleArt"
import { safeNext, useTitle } from "@/lib/utils"
import { Lane, Sign } from "@/pages/home/parts"

function authMessage(err: unknown): string {
  const code = err instanceof FirebaseError ? err.code : ""
  if (code === "auth/invalid-verification-code") return "That code isn't right. Please check it and try again."
  if (code === "auth/code-expired") return "That code has expired. Please ask for a new one."
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a while and try again."
  if (code === "auth/invalid-phone-number") return "Enter a valid 10-digit mobile number."
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return ""
  if (code === "auth/popup-blocked") return "Your browser blocked the Google window. Please allow pop-ups and try again."
  return "We couldn't sign you in. Please try again."
}

export function SignInPage() {
  useTitle("Sign in")
  const { user, loading, signInWithGoogle, sendOtp, confirmOtp } = useAuth()
  const [params] = useSearchParams()
  const [mobile, setMobile] = useState("")
  const [code, setCode] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState<"google" | "phone" | null>(null)
  const [error, setError] = useState("")

  if (loading) return <PageSkeleton />
  if (user) return <Navigate to={safeNext(params.get("next"))} replace />

  const run = async (kind: "google" | "phone", action: () => Promise<void>) => {
    setBusy(kind)
    setError("")
    try {
      await action()
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const submitPhone = (e: FormEvent) => {
    e.preventDefault()
    if (sentTo) {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter the 6-digit code.")
        return
      }
      void run("phone", () => confirmOtp(code))
      return
    }
    const normalized = normalizeMobile(mobile)
    if (!normalized) {
      setError("Enter a valid 10-digit mobile number.")
      return
    }
    void run("phone", async () => {
      await sendOtp(normalized)
      setSentTo(normalized)
    })
  }

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[1fr_minmax(0,1.05fr)]">
      <main className="flex flex-col px-4 py-5 sm:px-10">
        <Wordmark />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-10">
          <div>
            <h1 className="display text-6xl">Sign in to Carmitra</h1>
            <p className="mt-3 text-ink-600">Your WeSafe QR or PetSafe QR account works here too.</p>
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <form onSubmit={submitPhone} className="flex flex-col gap-4" noValidate>
            {sentTo ? (
              <>
                <TextField id="otp" label={`Code sent to ${formatMobile(sentTo)}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                <Button type="submit" size="lg" full busy={busy === "phone"}>
                  Verify and continue
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSentTo(null)
                    setCode("")
                    setError("")
                  }}
                >
                  Use a different number
                </Button>
              </>
            ) : (
              <>
                <MobileField id="mobile" label="Mobile number" value={mobile} onChange={setMobile} hint="Owners get their alerts on this number." />
                <Button type="submit" size="lg" full busy={busy === "phone"}>
                  Send code
                </Button>
              </>
            )}
          </form>

          <div className="flex items-center gap-3 text-sm text-ink-500">
            <span className="h-0.5 flex-1 bg-navy-900/15" />
            or
            <span className="h-0.5 flex-1 bg-navy-900/15" />
          </div>

          <Button variant="secondary" size="lg" full busy={busy === "google"} onClick={() => void run("google", signInWithGoogle)}>
            Continue with Google
          </Button>
          <div id={RECAPTCHA_ID} />
        </div>
      </main>

      <div aria-hidden="true" className="relative hidden overflow-hidden bg-navy-900 text-white lg:block">
        <p className="display px-12 pt-16 text-[clamp(4.5rem,8vw,8.5rem)] text-brand-400">
          Be reachable.
          <br />
          <span className="text-white">Stay private.</span>
        </p>
        <div className="absolute inset-x-0 bottom-0 h-[24%] bg-navy-800">
          <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15" />
          <Lane className="absolute inset-x-0 top-[40%] text-brand-400" />
        </div>
        <VehicleArt kind="car" paint="coral" className="absolute bottom-[18%] right-[6%] w-[72%] -scale-x-100" />
        <div className="absolute bottom-[48%] left-[12%]">
          <Sign big="No app" small="needed to scan" className="rotate-[-8deg] text-[20px]" />
        </div>
      </div>
    </div>
  )
}
