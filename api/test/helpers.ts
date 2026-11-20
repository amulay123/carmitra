import type { Server } from "node:http"
import type { AddressInfo } from "node:net"

import { createApp } from "../src/app"
import { adminAuth, db, tags } from "../src/firebase"

const PROJECT = "demo-carmitra"

export const sent: { mobile: string; message: string }[] = []

let server: Server
export let base = ""

/** The API on a local port, with WhatsApp alerts caught in `sent`. One proxy, so tests can set the visitor's address. */
export async function startServer() {
  const app = createApp({
    notify: async (mobile, message) => {
      sent.push({ mobile, message })
    },
    trustProxy: 1,
  })
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve())
  })
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`
}

export const stopServer = () => new Promise((resolve) => server.close(resolve))

export async function resetEmulators() {
  sent.length = 0
  const firestore = process.env.FIRESTORE_EMULATOR_HOST
  const auth = process.env.FIREBASE_AUTH_EMULATOR_HOST
  await fetch(`http://${firestore}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" })
  await fetch(`http://${auth}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE", headers: { Authorization: "Bearer owner" } })
}

type CallOptions = { token?: string; body?: unknown; method?: string; ip?: string }

export async function call(path: string, { token, body, method, ip = "203.0.113.1" }: CallOptions = {}) {
  const headers: Record<string, string> = { "X-Forwarded-For": ip }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const res = await fetch(`${base}${path}`, {
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  // oxlint-disable-next-line typescript/no-explicit-any
  const json = (await res.json()) as any
  return { status: res.status, json }
}

/** A real ID token from the auth emulator, for a user with these details. */
export async function signIn(uid: string, phoneNumber?: string) {
  await adminAuth.createUser({ uid, ...(phoneNumber ? { phoneNumber } : {}) }).catch((err) => {
    if (err.code !== "auth/uid-already-exists") throw err
  })
  const customToken = await adminAuth.createCustomToken(uid)
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST
  const res = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  })
  return ((await res.json()) as { idToken: string }).idToken
}

export const addTag = (code: string) => tags.doc(code).set({ code, claimed: false, cmtId: null, batch: "test", createdAt: new Date().toISOString() })

export const MOBILE = "+919876543210"
export const ownerBody = { name: "Asha Rao", mobile: "9876543210", city: "Pune", consent: { accepted: true } }
export const car = { type: "car", plate: "MH 12 AB 1234", model: "Honda City", colour: "White", contactMode: "chat" }

/** A signed-in owner with their details saved and one vehicle. */
export async function ownerWithVehicle(uid = "owner-1", phone: string | null = MOBILE, vehicle: Record<string, unknown> = car) {
  const token = await signIn(uid, phone ?? undefined)
  await call("/me", { token, method: "PUT", body: phone ? ownerBody : { ...ownerBody, mobile: "9876500001" } })
  const { status, json } = await call("/vehicles", { token, body: vehicle })
  if (status !== 201) throw new Error(`Vehicle not created: ${JSON.stringify(json)}`)
  return { token, cmtId: json.cmtId as string }
}

export const familyRecords = {
  async weSafe(uid: string) {
    const child = db.collection("Users").doc(uid).collection("ChildList").doc("child1")
    await child.set({ name: "Asha" })
    await child.collection("data").doc("personal_information").set({ name: "Asha Rao", phone: "9000000000", addressCity: "Pune" })
    return child
  },
  petSafe: (uid: string) => db.collection("petOwners").doc(uid).set({ uid, name: "Asha P", mobile: "+919111111111", city: "Nashik" }),
}
