import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"

const env = import.meta.env

// WeSafe's Firebase project: a WeSafe or PetSafeQR account is a Carmitra account.
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = getFirestore(app)

export const usingEmulators = env.VITE_USE_EMULATORS === "true"

if (usingEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9098", { disableWarnings: true })
  connectFirestoreEmulator(db, "127.0.0.1", 8091)
  auth.settings.appVerificationDisabledForTesting = true
}
