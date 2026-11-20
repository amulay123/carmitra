import { ArrowRight, EyeOff, Phone } from "lucide-react"
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from "motion/react"
import { useRef, useState } from "react"
import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { ScanView } from "@/components/vehicle/ScanView"
import { cn } from "@/lib/utils"

import { bloom, Container, reveal, rise, Road, Sign, SteeringWheel, useCalm } from "../parts"
import { CREATE_PATH, CREATE_QR, sampleVehicle, sampleVehicleWithNumber } from "../sample"

/** The owner's two choices. The phone beside the control shows the scan page for whichever is chosen. */
const modes = [
  { id: "chat", label: "Chat only", sub: "Number hidden", icon: EyeOff, result: "They message. You reply.", detail: "A private chat opens on their phone. Your number never appears, and neither does theirs." },
  { id: "number", label: "Show my number", sub: "Call and WhatsApp", icon: Phone, result: "They call or WhatsApp.", detail: "Your number is on the page for anyone who scans. The private chat is still there." },
] as const
type ModeId = (typeof modes)[number]["id"]

const phoneIn: Variants = {
  hidden: { opacity: 0, y: 90, rotate: -8 },
  shown: { opacity: 1, y: 0, rotate: 0, transition: { type: "spring", stiffness: 90, damping: 15, delay: 0.2 } },
}

function ChoiceCard({ chosen, onChoose }: { chosen: ModeId; onChoose: (mode: ModeId) => void }) {
  const mode = modes.find((m) => m.id === chosen)!
  return (
    <motion.div variants={rise} custom={2} className="rounded-[24px] border-2 border-navy-900 bg-white p-5 shadow-hard md:p-6">
      <p id="reach-choice" className="label-caps text-[13px]">
        You choose how they reach you
      </p>
      <div role="group" aria-labelledby="reach-choice" className="mt-3 grid grid-cols-2 gap-2">
        {modes.map(({ id, label, sub, icon: Icon }) => {
          const active = chosen === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onChoose(id)}
              className={cn("relative flex min-h-[4.5rem] flex-col items-start justify-center rounded-xl px-3 py-2.5 text-left transition-colors duration-200", active ? "text-white" : "bg-surface text-navy-900 hover:bg-brand-100")}
            >
              {/* One dark plate, shared by the two buttons: it slides to whichever is chosen. */}
              {active && <motion.span layoutId="reach-chosen" className="absolute inset-0 rounded-xl bg-navy-900" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative flex items-center gap-1.5 text-[15px] font-semibold">
                <Icon className={cn("size-4 shrink-0", active && "text-brand-400")} aria-hidden="true" />
                {label}
              </span>
              <span className={cn("relative text-xs", active ? "text-white/70" : "text-ink-500")}>{sub}</span>
            </button>
          )
        })}
      </div>
      <div aria-live="polite" className="mt-5 min-h-[8.5rem] overflow-hidden md:min-h-[7.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={chosen} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -22 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            <p className="display text-[2.6rem] md:text-[3.2rem]">{mode.result}</p>
            <p className="mt-2 text-sm text-ink-600">{mode.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <Link to={CREATE_PATH} className={buttonVariants({ variant: "primary", size: "lg", full: true, className: "mt-4" })}>
        {CREATE_QR}
      </Link>
    </motion.div>
  )
}

export function Scanner() {
  const ref = useRef<HTMLElement>(null)
  const still = useCalm() ? 0 : 1
  const [mode, setMode] = useState<ModeId>("chat")
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const wheelTurn = useTransform(scrollYProgress, [0, 1], [-80 * still, 80 * still])
  const phoneY = useTransform(scrollYProgress, [0, 1], [34 * still, -34 * still])

  return (
    <>
      <Road className="bg-surface" />

      <motion.section id="scanner" ref={ref} {...reveal(0.15)} className="overflow-hidden bg-brand-400 py-16 md:py-24">
        <Container className="grid items-center gap-x-10 gap-y-12 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-[30rem]">
            <motion.div aria-hidden="true" variants={bloom} className="absolute left-1/2 top-1/2 aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2">
              <motion.div style={{ rotate: wheelTurn }} className="size-full">
                <SteeringWheel className="size-full text-white/55" />
              </motion.div>
            </motion.div>
            <motion.div style={{ y: phoneY }}>
              <motion.div variants={phoneIn} className="relative mx-auto w-[min(19.5rem,78vw)] rounded-[40px] bg-navy-900 p-2.5 shadow-float">
                {/* The real scan page, with a sample vehicle. */}
                <div inert className="overflow-hidden rounded-[31px]">
                  <ScanView key={mode} profile={mode === "chat" ? sampleVehicle : sampleVehicleWithNumber} preview reason="blocking" />
                </div>
              </motion.div>
            </motion.div>
            <Sign shape="round" big="No app" small="needed" i={4} className="absolute right-[-3%] top-[-3%] rotate-[9deg] text-[13px] md:right-[-2%] md:top-[3%] md:text-[19px]" />
            <Sign shape="plate" big="0" small="sign-ups" i={5.5} className="absolute left-[-4%] top-[12%] rotate-[-8deg] text-[13px] md:bottom-[30%] md:left-[-7%] md:top-auto md:text-[19px]" />
            <Sign shape="round" big="6" small="quick reasons" i={7} className="absolute bottom-[-3%] right-[-3%] rotate-[7deg] text-[13px] md:bottom-[5%] md:right-[-6%] md:text-[19px]" />
          </div>

          <div className="flex flex-col gap-5">
            <motion.h2 variants={rise} className="display text-[clamp(3.6rem,8vw,7.4rem)]">
              Anyone can reach you.
            </motion.h2>
            <motion.p variants={rise} custom={1} className="max-w-[44ch] text-lg leading-snug text-navy-800">
              A phone camera opens your vehicle's page. The person scanning needs no app and no account.
            </motion.p>
            <ChoiceCard chosen={mode} onChoose={setMode} />
            <motion.a variants={rise} custom={3} href="#questions" className="label-caps group inline-flex min-h-11 items-center gap-1.5 self-start text-[13px]">
              Can people see my number?
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </motion.a>
          </div>
        </Container>
      </motion.section>
    </>
  )
}
