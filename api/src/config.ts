const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean)

type ServiceAccount = { project_id: string; client_email: string; private_key: string }

/** The key as one environment variable, for hosts with no private files: base64, or the JSON. */
function readServiceAccount(value: string | undefined): ServiceAccount | null {
  const text = value?.trim()
  if (!text) return null
  try {
    const key = JSON.parse(text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8")) as ServiceAccount
    if (key.project_id && key.client_email && key.private_key) return key
  } catch {
    // Reported below, so the error can never repeat any of the value.
  }
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not a valid service-account key.")
}

const serviceAccount = readServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT)
const projectId = process.env.FIREBASE_PROJECT_ID ?? serviceAccount?.project_id ?? process.env.GCLOUD_PROJECT ?? "demo-carmitra"

export const config = {
  port: Number(process.env.PORT ?? 8788),
  projectId,
  serviceAccount,
  // On Netlify, URL is the site's main domain.
  publicUrl: (process.env.PUBLIC_URL || process.env.URL || "https://carmitra.wesafeqr.com").replace(/\/$/, ""),
  webOrigins: list(process.env.WEB_ORIGINS),
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  /** How many proxies sit in front of the server, so a visitor's IP address is read correctly. */
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
}
