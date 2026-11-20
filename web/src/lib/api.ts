import { auth } from "./firebase"

const BASE = import.meta.env.VITE_API_URL as string

export class ApiFailure extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

type Options = { method?: string; body?: unknown }

/** Every write goes through the Carmitra API. A signed-in user's token goes with it. */
export async function api<T>(path: string, { method, body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const token = await auth.currentUser?.getIdToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: method ?? (body !== undefined ? "POST" : "GET"),
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiFailure("We couldn't reach Carmitra. Check your connection and try again.", "network")
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const error = json?.error ?? {}
    throw new ApiFailure(error.message ?? "Something went wrong. Please try again.", error.code ?? "unknown", error.fields)
  }
  return json as T
}

export const failureMessage = (err: unknown) => (err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.")

export const failureFields = (err: unknown): Record<string, string> => (err instanceof ApiFailure ? err.fields : {})
