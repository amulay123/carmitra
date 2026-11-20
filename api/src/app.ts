import cors from "cors"
import express from "express"

import { config } from "./config"
import { errorHandler, notFound } from "./http"
import { ownerRoutes } from "./routes/owner"
import { publicRoutes } from "./routes/public"
import { sendWhatsApp, type Notify } from "./services/whatsapp"

export function createApp({ notify = sendWhatsApp, trustProxy = config.trustProxy }: { notify?: Notify; trustProxy?: number } = {}) {
  const app = express()
  app.disable("x-powered-by")
  app.set("trust proxy", trustProxy)
  app.use(cors({ origin: config.webOrigins, maxAge: 600 }))
  app.use(express.json({ limit: "50kb" }))

  // Public first: the owner routes below require a signed-in user for everything they match.
  app.use("/v1", publicRoutes(notify))
  app.use("/v1", ownerRoutes())

  app.use(() => {
    throw notFound("That address")
  })
  app.use(errorHandler)
  return app
}
