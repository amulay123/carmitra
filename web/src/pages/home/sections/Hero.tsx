import { MessageSquareLock } from "lucide-react"
import { motion, useMotionValueEvent, useScroll, useTransform, type Variants } from "motion/react"
import { useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { VehicleArt } from "@/components/vehicle/VehicleArt"

import { AlertCard, EASE, Float, Lane, Magnetic, rise, Sign, useCalm } from "../parts"
import { CREATE_PATH, CREATE_QR } from "../sample"

/** The floating menu. It slides away while you scroll down and returns when you scroll up. */
export function HomeNav() {
  const { scrollY } = useScroll()
  const [away, setAway] = useState(false)

  useMotionValueEvent(scrollY, "change", (now) => {
    const before = scrollY.getPrevious() ?? 0
    setAway(now > before && now > 500)
  })

  const link = "rounded-lg px-3.5 py-2 transition-colors hover:bg-navy-900 hover:text-brand-400"
  return (
    <motion.header
      initial={{ y: -96 }}
      animate={{ y: away ? -96 : 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      onFocusCapture={() => setAway(false)}
      className="fixed inset-x-0 top-3 z-50 px-3 md:top-4 md:px-6"
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 rounded-2xl border-2 border-navy-900 bg-surface pl-4 pr-1.5 text-navy-900 shadow-hard-sm">
        <Wordmark />
        <nav aria-label="Page" className="label-caps hidden items-center text-[13px] md:flex">
          <a href="#scanner" className={link}>
            What a scanner sees
          </a>
          <a href="#steps" className={link}>
            How it works
          </a>
          <a href="#chat" className={link}>
            Private chat
          </a>
          <a href="#questions" className={link}>
            Questions
          </a>
        </nav>
        <Link to="/auth" className="label-caps inline-flex h-10 items-center rounded-[10px] border-2 border-navy-900 bg-brand-400 px-4 text-[13px] transition-colors hover:bg-navy-900 hover:text-brand-400">
          Sign in
        </Link>
      </div>
    </motion.header>
  )
}

const WORD = "carmitra"

const letter: Variants = {
  hidden: { y: "60%", opacity: 0, rotate: 9 },
  shown: (i: number) => ({ y: 0, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 190, damping: 16, delay: 0.1 + i * 0.06 } }),
}

/** The car drives in from the right-hand edge. */
const carIn: Variants = {
  hidden: { x: "60%", opacity: 0 },
  shown: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 70, damping: 16, delay: 0.45 } },
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const still = useCalm() ? 0 : 1

  // As the hero scrolls away, the headline sinks, and the car drives on with its wheels turning.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const wordY = useTransform(scrollYProgress, [0, 1], [0, 190 * still])
  const carX = useTransform(scrollYProgress, [0, 1], [0, -300 * still])
  const wheelTurn = useTransform(scrollYProgress, [0, 1], [0, -460 * still])
  const signTurn = useTransform(scrollYProgress, [0, 1], [0, 50 * still])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60 * still])

  return (
    <motion.section ref={ref} initial="hidden" animate="shown" className="relative isolate overflow-hidden bg-navy-900 text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_68%_40%,#30333b_0%,transparent_70%)]" />

      <div className="relative mx-auto flex h-[100svh] max-h-[840px] min-h-[680px] max-w-[1440px] flex-col px-5 pb-[11.5rem] pt-24 md:h-[min(100dvh,900px)] md:max-h-none md:min-h-[720px] md:px-10 md:pb-[13.5rem] md:pt-24">
        <motion.div style={{ y: wordY }} className="relative z-10">
          <h1 aria-label="Carmitra" className="display whitespace-nowrap text-center text-[23.5vw] leading-[0.8] text-brand-400 [font-stretch:62%] md:text-[min(23.4vw,338px)]">
            {WORD.split("").map((char, i) => (
              <motion.span key={i} aria-hidden="true" variants={letter} custom={i} className="inline-block">
                {char}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        {/* The road. The car's wheels sit on its top edge. */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-20 h-[8.5rem] bg-navy-800 md:h-[10.5rem]">
          <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15" />
          <Lane className="absolute inset-x-0 top-[38%] text-brand-400" />
        </div>

        <motion.div style={{ x: carX }} className="pointer-events-none absolute bottom-[6.6rem] left-[3%] z-30 w-[118%] md:bottom-[8.4rem] md:left-[36%] md:w-[62%]">
          <motion.div variants={carIn}>
            <VehicleArt kind="car" paint="coral" spin={wheelTurn} className="w-full -scale-x-100" />
          </motion.div>
        </motion.div>

        <motion.div style={{ rotate: signTurn }} className="absolute bottom-[44%] right-[4%] z-40 md:bottom-auto md:left-[40%] md:right-auto md:top-[41%]">
          <Sign big="No app" small="needed to scan" i={8} className="rotate-[8deg] text-[15px] md:text-[21px]" />
        </motion.div>

        <motion.div style={{ y: copyY }} className="relative z-40 mt-5 md:mt-auto md:max-w-[26rem]">
          <motion.p variants={rise} custom={5} className="text-[17px] leading-snug md:text-xl">
            A QR sticker for your car or bike. One scan, and anyone who needs you can reach you. Your number stays hidden unless you choose to show it.
          </motion.p>
          <motion.div variants={rise} custom={6.5} className="mt-5 flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link to={CREATE_PATH} className={buttonVariants({ variant: "onDark", size: "lg" })}>
                {CREATE_QR}
              </Link>
            </Magnetic>
            <a href="#steps" className={buttonVariants({ variant: "outline", size: "lg" })}>
              How it works
            </a>
          </motion.div>
        </motion.div>

        <div aria-hidden="true" className="absolute right-[3%] top-[41%] z-40 hidden flex-col items-end gap-3 xl:flex">
          <motion.div variants={rise} custom={12}>
            <Float>
              <AlertCard title="Your car's QR was scanned" text="Someone is at MH •• 1234." time="now" className="shadow-hard-light" />
            </Float>
          </motion.div>
          <motion.div variants={rise} custom={15} className="mr-20">
            <Float delay={1.4}>
              <AlertCard icon={MessageSquareLock} title="New private message" text="Your car is blocking mine. Could you move it?" time="1m" className="shadow-hard-light" />
            </Float>
          </motion.div>
        </div>
      </div>

      <div aria-hidden="true" className="zebra absolute inset-x-0 -bottom-px z-40" />
    </motion.section>
  )
}
