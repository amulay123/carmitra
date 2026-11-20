import type { ErrorRequestHandler } from "express"
import { ZodError } from "zod"

import { fieldErrors } from "@carmitra/shared"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const notFound = (what = "That") => new ApiError(404, "not_found", `${what} was not found.`)

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields = fieldErrors(err)
    const message = Object.values(fields)[0] ?? "Please check the details."
    res.status(400).json({ error: { code: "invalid_input", message, fields } })
    return
  }
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "invalid_json", message: "The request body isn't valid JSON." } })
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: "server_error", message: "Something went wrong. Please try again." } })
}
