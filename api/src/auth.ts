import { createHash, randomBytes } from "node:crypto"

import type { RequestHandler } from "express"
import type { DecodedIdToken } from "firebase-admin/auth"

import { adminAuth } from "./firebase"
import { ApiError } from "./http"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DecodedIdToken
    }
  }
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex")

/** 32 random bytes: a room key nobody can guess. */
export const randomToken = () => randomBytes(32).toString("base64url")

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

export function userOf(req: { user?: DecodedIdToken }): DecodedIdToken {
  if (!req.user) throw new ApiError(401, "unauthenticated", "Please sign in.")
  return req.user
}
