import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore, Timestamp } from "firebase-admin/firestore"

import { config } from "./config"

// Credentials come from FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS; the emulators need none.
const key = config.serviceAccount
const existing = getApps()[0]
const app =
  existing ??
  initializeApp({
    projectId: config.projectId,
    ...(key ? { credential: cert({ projectId: key.project_id, clientEmail: key.client_email, privateKey: key.private_key }) } : {}),
  })

export const db = getFirestore(app)
if (!existing) db.settings({ ignoreUndefinedProperties: true })

export const adminAuth = getAuth(app)

// Every Carmitra collection starts with "car". Nothing is written anywhere else.
export const owners = db.collection("carOwners")
export const vehicles = db.collection("carVehicles")
export const tags = db.collection("carTags")
export const scans = db.collection("carScans")
export const chats = db.collection("carChats")
export const rooms = db.collection("carChatRooms")
/** Server only: what links a room key to its chat, and who the visitor is. */
export const chatKeys = db.collection("carChatKeys")
export const stickerOrders = db.collection("carStickerOrders")
export const throttle = db.collection("carThrottle")
export const blocks = db.collection("carBlocks")
/** Server only: partners and the hash of each one's API key. */
export const partners = db.collection("carPartners")
/** Server only: a partner's application reference, so a retry finds the same vehicle. */
export const partnerRefs = db.collection("carPartnerRefs")

export const privateRef = (cmtId: string) => vehicles.doc(cmtId).collection("private").doc("details")
export const ownerVehicles = (uid: string) => owners.doc(uid).collection("vehicles")
export const messages = (roomKey: string) => rooms.doc(roomKey).collection("carMessages")

export const nowIso = () => new Date().toISOString()

/**
 * When Firestore may delete a record. A TTL policy on the field `expireAt` does the deleting;
 * README.md has the steps. It has to be a timestamp, not text.
 */
export const expireAt = (fromMs: number, days: number) => Timestamp.fromMillis(fromMs + days * 24 * 60 * 60 * 1000)
