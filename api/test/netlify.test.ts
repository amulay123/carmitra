import type { Context } from "@netlify/functions"
import { beforeEach, describe, expect, it } from "vitest"

import handler from "../src/netlify"
import { ownerWithVehicle, resetEmulators, startServer, stopServer } from "./helpers"

const site = "https://carmitra.test"
const from = (ip: string) => ({ ip }) as Context

const send = async (path: string, init: RequestInit = {}, ip = "203.0.113.1") => {
  const res = await handler(new Request(`${site}/v1${path}`, init), from(ip))
  // oxlint-disable-next-line typescript/no-explicit-any
  return { status: res.status, json: (await res.json()) as any }
}

const asJson = (body: unknown, headers: Record<string, string> = {}) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
})

describe("the API on Netlify", () => {
  let cmtId: string

  beforeEach(async () => {
    await resetEmulators()
    // The helpers' own server is only needed to set up the owner and vehicle.
    await startServer()
    cmtId = (await ownerWithVehicle()).cmtId
    await stopServer()
  })

  it("answers health checks and returns API errors as JSON", async () => {
    expect(await send("/health")).toEqual({ status: 200, json: { ok: true } })
    const missing = await send("/rooms", asJson({ cmtId: "CMT-2222-22", reason: "lights" }))
    expect(missing.status).toBe(404)
    expect(missing.json.error.code).toBe("not_found")
  })

  it("limits scans by the real visitor address, whatever the request claims", async () => {
    const scan = (ip: string, claimed: string) => send("/scans", asJson({ cmtId }, { "X-Forwarded-For": claimed }), ip)

    const first = await scan("203.0.113.1", "198.51.100.1")
    const sameVisitor = await scan("203.0.113.1", "198.51.100.2")
    const otherVisitor = await scan("203.0.113.2", "198.51.100.1")

    expect(first.status).toBe(201)
    expect(sameVisitor.json.scanId).toBe(first.json.scanId)
    expect(otherVisitor.json.scanId).not.toBe(first.json.scanId)
  })

  it("opens a chat through the function", async () => {
    const res = await send("/rooms", asJson({ cmtId, reason: "lights" }))
    expect(res.status).toBe(201)
    expect(res.json.roomKey).toBeTruthy()
  })
})
