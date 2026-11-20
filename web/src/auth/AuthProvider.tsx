import {
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth"
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { auth } from "@/lib/firebase"

type AuthValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  sendOtp: (mobile: string) => Promise<void>
  confirmOtp: (code: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export const RECAPTCHA_ID = "recaptcha-container"

/** Sign-in as on WeSafe and PetSafeQR: Google, or a mobile number and a one-time code. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const confirmation = useRef<ConfirmationResult | null>(null)
  const verifier = useRef<RecaptchaVerifier | null>(null)

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next)
        setLoading(false)
      }),
    [],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signInWithGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider())
      },
      sendOtp: async (mobile) => {
        verifier.current?.clear()
        verifier.current = new RecaptchaVerifier(auth, RECAPTCHA_ID, { size: "invisible" })
        try {
          confirmation.current = await signInWithPhoneNumber(auth, mobile, verifier.current)
        } catch (err) {
          verifier.current?.clear()
          verifier.current = null
          throw err
        }
      },
      confirmOtp: async (code) => {
        if (!confirmation.current) throw new Error("Please ask for a new code.")
        await confirmation.current.confirm(code)
      },
      signOut: () => firebaseSignOut(auth),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
