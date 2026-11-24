import type { ReasonId, VehicleType } from "./vehicle"

/** All dates are ISO 8601 strings. */
export type IsoDate = string

/** How people who scan can reach the owner. "chat" never shows the owner's number. */
export type ContactMode = "chat" | "number"

/** `via` names the partner the consent was given through, such as "tommyandfurry". */
export type Consent = { version: string; at: IsoDate; via?: string }

/** carOwners/{uid}: readable by the owner only. */
export type CarOwner = {
  uid: string
  mobile: string
  name: string
  city: string
  /** True when the number came from mobile-OTP sign-in, or from a partner that verified it. */
  mobileVerified: boolean
  /** Who brought the owner first: "direct", or a partner's id. Missing on owners from before partners. */
  source?: string
  consent: Consent
  createdAt: IsoDate
  updatedAt: IsoDate
}

/**
 * carVehicles/{cmtId}: public, it is what a scan shows. It deliberately has no owner id
 * (a WeSafe user's id must not be published) and only part of the plate.
 */
export type VehicleProfile = {
  cmtId: string
  type: VehicleType
  /** Make and model as the owner wrote them: "Honda City". May be empty. */
  model: string
  /** One of COLOURS, or empty. */
  colour: string
  /** From maskPlate(): "MH •• 1234". */
  plateMasked: string
  noteForVisitors: string
  contactMode: ContactMode
  /** Null unless the owner chose to show their number. */
  contact: { name: string; phone: string } | null
  createdAt: IsoDate
  updatedAt: IsoDate
}

/** carVehicles/{cmtId}/private/details: readable by the owner only. */
export type VehiclePrivate = {
  ownerUid: string
  /** The full registration number, stored without spaces. */
  plate: string
  tagCodes: string[]
  /** When the owner agreed to show their number for this vehicle, if they have. */
  numberConsentAt: IsoDate | null
  /** Who added the vehicle: "direct", or a partner's id. Missing on vehicles from before partners. */
  source?: string
  /** The partner's reference for the application that added it. */
  partnerRef?: string | null
}

/** carTags/{code}: anyone can look up one code. */
export type CarTag = {
  code: string
  claimed: boolean
  cmtId: string | null
  batch: string
  createdAt: IsoDate
}

/** carScans/{id}: readable by the vehicle's owner. */
export type CarScan = {
  id: string
  cmtId: string
  plateMasked: string
  vehicleLabel: string
  ownerUid: string
  via: "id" | "tag"
  tagCode: string | null
  read: boolean
  createdAt: IsoDate
}

export type ChatStatus = "open" | "closed" | "blocked"

/** carChats/{chatId}: the owner's side of a chat, readable by the owner only. */
export type CarChat = {
  chatId: string
  /** The key to the room the visitor holds. The owner reads the messages through it. */
  roomKey: string
  cmtId: string
  ownerUid: string
  plateMasked: string
  vehicleLabel: string
  reason: ReasonId
  status: ChatStatus
  unreadForOwner: number
  lastMessage: string
  lastFrom: "visitor" | "owner"
  lastMessageAt: IsoDate
  createdAt: IsoDate
  closesAt: IsoDate
}

/** carChatRooms/{roomKey}: what anyone holding the key sees. No owner id, no numbers. */
export type ChatRoom = {
  cmtId: string
  plateMasked: string
  vehicleLabel: string
  reason: ReasonId
  status: ChatStatus
  /** When the owner last opened the chat. */
  ownerSeenAt: IsoDate | null
  createdAt: IsoDate
  closesAt: IsoDate
}

/** carChatRooms/{roomKey}/carMessages/{id} */
export type ChatMessage = {
  id: string
  from: "visitor" | "owner"
  text: string
  createdAt: IsoDate
}

/** carStickerOrders/{id}: readable by the owner who asked. */
export type StickerOrder = {
  id: string
  ownerUid: string
  cmtId: string
  plate: string
  name: string
  mobile: string
  line1: string
  line2: string
  city: string
  state: string
  pin: string
  status: "requested"
  createdAt: IsoDate
}

export type OwnerPrefill = { name: string; mobile: string; city: string; mobileLocked: boolean }

export type MeResponse = { owner: CarOwner | null; prefill: OwnerPrefill }
