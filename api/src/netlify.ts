import type { AddressInfo } from "node:net"

import type { Context } from "@netlify/functions"

import { createApp } from "./app"

/*
 * The whole API as one Netlify Function, at /v1 on the same address as the website.
 * netlify/functions/api.mjs publishes the built copy of this file.
 *
 * Netlify hands over a web Request, and the API is an Express app that expects a Node
 * connection. So the app listens on a private local port, once per running instance, and each
 * request is passed to it. Uploads and error handling then work exactly as they do elsewhere.
 */

let local: Promise<string> | undefined

function localApi() {
  local ??= new Promise((resolve, reject) => {
    // One proxy in front: this function, which sets the visitor's address below.
    const server = createApp({ trustProxy: 1 }).listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
    })
    server.once("error", reject)
    server.unref()
  })
  return local
}

/** Headers that describe one connection, and must not be carried on to the next. */
const CONNECTION_HEADERS = ["host", "connection", "content-length", "transfer-encoding", "accept-encoding"]

export default async function handler(req: Request, context: Context) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("FIREBASE_SERVICE_ACCOUNT is not set. Add it in Netlify and deploy again.")
    return Response.json({ error: { code: "not_configured", message: "Carmitra isn't available right now." } }, { status: 503 })
  }

  const headers = new Headers(req.headers)
  for (const name of CONNECTION_HEADERS) headers.delete(name)
  // Replaces anything the caller sent, so the scan limit can't be dodged with a made-up address.
  headers.set("x-forwarded-for", context.ip)

  const { pathname, search } = new URL(req.url)
  const hasBody = req.method !== "GET" && req.method !== "HEAD"
  const res = await fetch(`${await localApi()}${pathname}${search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  })

  const answer = new Headers(res.headers)
  for (const name of ["connection", "keep-alive", "transfer-encoding", "content-length"]) answer.delete(name)
  return new Response(res.status === 204 ? null : await res.arrayBuffer(), { status: res.status, headers: answer })
}
