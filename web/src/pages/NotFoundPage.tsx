import { Link } from "react-router-dom"

import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { useTitle } from "@/lib/utils"

export function NotFoundPage() {
  useTitle("Page not found")
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <Wordmark />
      <h1 className="text-3xl font-bold">We can't find that page</h1>
      <p className="text-ink-600">The link may be old or mistyped.</p>
      <Link to="/" className={buttonVariants()}>
        Go to the home page
      </Link>
    </main>
  )
}
