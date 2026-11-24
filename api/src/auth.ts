import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import type { RequestHandler } from "express"
import type { DecodedIdToken } from "firebase-admin/auth"

import { adminAuth, partners } from "./firebase"
import { ApiError } from "./http"

export type Partner = { id: string; name: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DecodedIdToken
      partner?: Partner
    }
  }
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")

/** 32 random bytes: a room key nobody can guess. */
export const randomToken = () => randomBytes(32).toString("base64url")

/** A partner's key: csk_<partnerId>_<secret>. Only its hash is stored. */
export const newPartnerKey = (partnerId: string) => `csk_${partnerId}_${randomToken()}`

export const requireUser: RequestHandler = async (req, _res, next) => {
  const token = /^Bearer (.+)$/.exec(req.get("authorization") ?? "")?.[1]
  if (!token) throw new ApiError(401, "unauthenticated", "Please sign in.")
  try {
    req.user = await adminAuth.verifyIdToken(token)
  } catch {
    throw new ApiError(401, "unauthenticated", "Please sign in again.")
  }
  next()
}

const keyRefused = () => new ApiError(401, "invalid_api_key", "The API key is missing or not valid.")

export const requirePartner: RequestHandler = async (req, _res, next) => {
  const key = req.get("x-api-key") ?? ""
  const partnerId = /^csk_([a-z0-9-]+)_/.exec(key)?.[1]
  if (!partnerId) throw keyRefused()
  const data = (await partners.doc(partnerId).get()).data()
  if (!data?.active || typeof data.keyHash !== "string") throw keyRefused()
  const given = Buffer.from(sha256(key))
  const stored = Buffer.from(data.keyHash)
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) throw keyRefused()
  req.partner = { id: partnerId, name: String(data.name) }
  next()
}

export function userOf(req: { user?: DecodedIdToken }): DecodedIdToken {
  if (!req.user) throw new ApiError(401, "unauthenticated", "Please sign in.")
  return req.user
}

export function partnerOf(req: { partner?: Partner }): Partner {
  if (!req.partner) throw keyRefused()
  return req.partner
}
