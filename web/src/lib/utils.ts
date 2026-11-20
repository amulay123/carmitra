import { clsx, type ClassValue } from "clsx"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"

import { scanPath } from "@carmitra/shared"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const publicUrl = (import.meta.env.VITE_PUBLIC_URL as string).replace(/\/$/, "")
export const scanUrl = (cmtId: string) => `${publicUrl}${scanPath(cmtId)}`

/** The sister products, which share Carmitra's sign-in. */
export const weSafeUrl = (import.meta.env.VITE_WESAFE_URL as string | undefined) || "https://wesafeqr.com"
export const petSafeUrl = (import.meta.env.VITE_PETSAFE_URL as string | undefined) || "https://petsafe.wesafeqr.com"
/** The partner whose brand Carmitra carries. */
export const tommyAndFurryUrl = (import.meta.env.VITE_TOMMYANDFURRY_URL as string | undefined) || "https://tommyandfurry.com"

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Carmitra`
  }, [title])
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
}

/** "just now", "5 min ago", "3 hr ago", then the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return formatDateTime(iso)
}

/** After a failed submit: takes the person to the first field that needs fixing. */
export function focusFirstError() {
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (field) field.focus()
    else window.scrollTo(0, 0)
  })
}

/** Only paths inside this site, so a crafted link can't send someone elsewhere after sign-in. */
export function safeNext(next: string | null, fallback = "/app"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback
}

/** Browser storage can be missing or blocked; the site works without it. */
export const stored = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Not saved: the visitor can still use the link they have.
    }
  },
}

/** The time now, updated every minute, for anything that changes as time passes. */
export function useNow(everyMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(timer)
  }, [everyMs])
  return now
}
