import { Ban, Lightbulb, PhoneCall, TriangleAlert, Truck } from "lucide-react"
import { motion, useScroll, useTransform, type Variants } from "motion/react"
import { useRef } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn, petSafeUrl, weSafeUrl } from "@/lib/utils"

import { Container, reveal, rise, SteeringWheel, useCalm } from "../parts"

const uses = [
  { icon: Ban, title: "Blocked in", text: "Ask the owner to move, without hunting for them.", status: "Available now", box: "bg-white text-navy-900 rotate-[-3deg]" },
  { icon: Lightbulb, title: "Lights or windows", text: "A heads-up before the battery runs flat or the rain gets in.", status: "Available now", box: "bg-brand-400 text-navy-900 rotate-[2deg] md:mt-6" },
  { icon: Truck, title: "Parking and towing", text: "Someone nearby can warn you before the tow truck does.", status: "Available now", box: "bg-navy-900 text-white rotate-[-2deg]" },
  { icon: TriangleAlert, title: "Accident or damage", text: "Whoever saw it can tell you what happened.", status: "Available now", box: "bg-white text-navy-900 rotate-[3deg] md:mt-8" },
  { icon: PhoneCall, title: "Hidden-number calls", text: "Phone calls where neither side sees the other's number.", status: "Coming later", box: "bg-sky-200 text-navy-900 rotate-[-2deg] md:mt-2" },
]

const backdrop = [
  "left-[-3%] top-[8%] size-40 rotate-[-18deg] md:size-64",
  "right-[4%] top-[-6%] size-48 rotate-[22deg] md:size-80",
  "bottom-[-8%] left-[34%] size-44 rotate-[12deg] md:size-72",
  "bottom-[6%] right-[-4%] size-32 rotate-[-24deg] md:size-52",
]

/** Cards are dealt onto the table, each from its own angle. */
const deal: Variants = {
  hidden: (i: number) => ({ opacity: 0, y: 110, rotate: i % 2 ? 16 : -16, scale: 0.86 }),
  shown: (i: number) => ({ opacity: 1, y: 0, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 150, damping: 15, delay: 0.25 + i * 0.12 } }),
}

export function Uses() {
  const ref = useRef<HTMLElement>(null)
  const still = useCalm() ? 0 : 1
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const drift = useTransform(scrollYProgress, [0, 1], [70 * still, -70 * still])

  return (
    <motion.section ref={ref} {...reveal(0.2)} className="relative isolate overflow-hidden border-t-2 border-navy-900 bg-salmon-400 py-16 text-navy-900 md:py-24">
      <motion.div aria-hidden="true" style={{ y: drift }} className="absolute inset-0 -z-10 text-salmon-300">
        {backdrop.map((place) => (
          <SteeringWheel key={place} className={cn("absolute", place)} />
        ))}
      </motion.div>

      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          <motion.h2 variants={rise} className="display text-[clamp(3.6rem,8.6vw,8.2rem)] md:col-span-8">
            One sticker for every knock on the window.
          </motion.h2>
          <motion.div variants={rise} custom={2} className="md:col-span-4 md:pt-3">
            <h3 className="text-2xl font-extrabold">Part of the WeSafe family</h3>
            <p className="mt-2 max-w-[38ch] text-[15px] leading-snug">The same sign-in works on WeSafe QR for people and PetSafe QR for pets.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={petSafeUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ink", className: "shadow-hard-light" })}>
                See PetSafe QR
              </a>
              <a href={weSafeUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}>
                WeSafe QR
              </a>
            </div>
          </motion.div>
        </div>
      </Container>

      <ul className="snap-row mx-auto mt-14 flex max-w-[1240px] snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-8 pt-10 md:mt-16 md:grid md:grid-cols-5 md:overflow-visible md:px-8">
        {uses.map(({ icon: Icon, ...use }, i) => (
          <motion.li
            key={use.title}
            variants={deal}
            custom={i}
            whileHover={{ y: -12, scale: 1.04, rotate: i % 2 ? -2 : 2 }}
            className={cn("relative w-[70vw] max-w-[17rem] shrink-0 snap-center rounded-[20px] border-2 border-navy-900 p-5 pt-10 shadow-hard md:w-auto md:max-w-none", use.box)}
          >
            <span className="absolute -top-7 left-5 grid size-14 place-items-center rounded-xl border-2 border-navy-900 bg-white text-navy-900 shadow-hard-sm">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <p className="label-caps flex items-center gap-1.5 text-[11px]">
              <span aria-hidden="true" className={cn("size-2 rounded-full", use.status === "Available now" ? "bg-brand-400 ring-2 ring-navy-900" : "bg-current opacity-50")} />
              {use.status}
            </p>
            <h3 className="mt-2 text-xl font-extrabold leading-tight">{use.title}</h3>
            <p className="mt-1.5 text-sm leading-snug opacity-85">{use.text}</p>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}
