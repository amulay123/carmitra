import "./home.css"

import { MotionConfig } from "motion/react"

import { useTitle } from "@/lib/utils"

import { Chat } from "./sections/Chat"
import { Closing, Footer, Questions } from "./sections/Closing"
import { Gets } from "./sections/Gets"
import { Hero, HomeNav } from "./sections/Hero"
import { MOTION_MODE } from "./parts"
import { Scanner } from "./sections/Scanner"
import { Steps } from "./sections/Steps"
import { Uses } from "./sections/Uses"

/**
 * The marketing home page. Its blocks follow PetSafeQR's, in the same order, in Carmitra's
 * own colours: asphalt hero, cream "what your vehicle gets", yellow "what a scanner sees",
 * asphalt "how it works", mint "private chat", ember "what one sticker is for", cream
 * questions, asphalt closing, cream footer.
 *
 * Motion is by Motion (motion/react); see parts.tsx, which also explains what people who
 * ask their device to reduce motion get instead.
 */
export function HomePage() {
  useTitle("A QR sticker for your car or bike")
  return (
    <MotionConfig reducedMotion={MOTION_MODE}>
      <div className="bg-surface">
        <HomeNav />
        <main>
          <Hero />
          <Gets />
          <Scanner />
          <Steps />
          <Chat />
          <Uses />
          <Questions />
          <Closing />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
