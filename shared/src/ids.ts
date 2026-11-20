/** 32 characters that can't be confused when read off a sticker: no 0, 1, I or O. The same set PetSafeQR uses. */
export const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

const CMT_RE = /^CMT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/
const TAG_RE = /^CT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/

function randomChars(count: number): string {
  // 256 is a multiple of 32, so taking each byte modulo 32 is unbiased.
  const bytes = crypto.getRandomValues(new Uint8Array(count))
  return Array.from(bytes, (b) => ID_ALPHABET[b % 32]).join("")
}

/** A vehicle's Carmitra ID, like CMT-7K2M-94. */
export function generateCmtId(): string {
  const c = randomChars(6)
  return `CMT-${c.slice(0, 4)}-${c.slice(4)}`
}

/** A pre-printed sticker's code, like CT-7K2M-94XQ. */
export function generateTagCode(): string {
  const c = randomChars(8)
  return `CT-${c.slice(0, 4)}-${c.slice(4)}`
}

export const isCmtId = (value: string) => CMT_RE.test(value)
export const isTagCode = (value: string) => TAG_RE.test(value)

/** Accepts what people type: any case, with or without the dashes. Null if it can't be one. */
export function normalizeCmtId(input: string): string | null {
  const c = input.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^CMT/, "")
  if (c.length !== 6) return null
  const id = `CMT-${c.slice(0, 4)}-${c.slice(4)}`
  return isCmtId(id) ? id : null
}

/** Accepts a typed code, or the whole link from a sticker's QR. Null if it can't be one. */
export function normalizeTagCode(input: string): string | null {
  const fromLink = /\/t\/([^/?#\s]+)/.exec(input)?.[1] ?? input
  const c = fromLink.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^CT/, "")
  if (c.length !== 8) return null
  const code = `CT-${c.slice(0, 4)}-${c.slice(4)}`
  return isTagCode(code) ? code : null
}
