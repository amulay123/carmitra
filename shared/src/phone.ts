/** An Indian mobile as +91XXXXXXXXXX, from what people type. Null if it isn't one. */
export function normalizeMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "")
  let local = digits
  if (digits.length === 12 && digits.startsWith("91")) local = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith("0")) local = digits.slice(1)
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null
}

/** The 10 digits of a +91 number. */
export const localMobile = (mobile: string) => mobile.replace(/^\+91/, "")

/** "+91 98765 43210" */
export function formatMobile(mobile: string): string {
  const local = localMobile(mobile)
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
}
