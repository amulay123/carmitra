import { ArrowRight } from "lucide-react"
import { motion, type Variants } from "motion/react"
import { Link } from "react-router-dom"

import { VehicleArt, type Paint } from "@/components/vehicle/VehicleArt"
import { cn } from "@/lib/utils"

import { Container, LaneLine, reveal, rise, Sign, Tilt } from "../parts"
import { CREATE_PATH, CREATE_QR } from "../sample"

type Card = {
  label: string
  caption: string
  pill: string
  to: string
  art: { kind: "car" | "suv" | "scooter"; paint: Paint; className: string }
  span: string
  tone: string
  arrow: string
  labelClass: string
  sign: boolean
}

const darkArrow = "bg-navy-900 text-white group-hover:bg-white group-hover:text-navy-900"

const cards: Card[] = [
  {
    label: "QR sticker",
    caption: "Ready the moment you add your vehicle.",
    pill: "CMT-7K2M-94",
    to: "#steps",
    art: { kind: "car", paint: "navy", className: "right-[3%] top-[20%] w-[82%] md:top-[17%] md:w-[80%]" },
    span: "md:col-span-6 md:row-span-2",
    tone: "bg-brand-400 text-navy-900",
    arrow: darkArrow,
    labelClass: "md:text-[7.4rem]",
    sign: true,
  },
  {
    label: "Bikes too",
    caption: "Cars, bikes and scooters, one login.",
    pill: "Every vehicle",
    to: CREATE_PATH,
    art: { kind: "scooter", paint: "coral", className: "left-1/2 top-[16%] w-[62%] -translate-x-1/2 md:top-[14%] md:w-[74%]" },
    span: "md:col-span-3 md:row-span-2",
    tone: "bg-sky-300 text-navy-900",
    arrow: darkArrow,
    labelClass: "",
    sign: false,
  },
  {
    label: "Private chat",
    caption: "",
    pill: "Number hidden",
    to: "#chat",
    art: { kind: "car", paint: "cream", className: "right-[-40%] top-[9%] w-[100%] -scale-x-100 md:top-[7%] md:w-[96%]" },
    span: "md:col-span-3",
    tone: "bg-salmon-400 text-navy-900",
    arrow: darkArrow,
    labelClass: "md:text-[3.7rem]",
    sign: false,
  },
  {
    label: "Alerts",
    caption: "",
    pill: "On WhatsApp",
    to: "#chat",
    art: { kind: "suv", paint: "green", className: "right-[-40%] top-[13%] w-[100%] -scale-x-100 md:top-[12%] md:w-[98%]" },
    span: "md:col-span-3",
    tone: "bg-navy-900 text-white",
    arrow: "bg-brand-400 text-navy-900 group-hover:bg-white",
    labelClass: "md:text-[3.7rem]",
    sign: false,
  },
]

const tileIn: Variants = {
  hidden: { opacity: 0, y: 70, scale: 0.93 },
  shown: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 17, delay: 0.15 + i * 0.11 } }),
}

function GetCard({ card, i }: { card: Card; i: number }) {
  const className = cn("group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[24px] border-2 border-navy-900 p-5 shadow-hard md:p-6", card.tone)
  const inner = (
    <>
      <span className="label-caps absolute left-4 top-4 z-20 rounded-md border-2 border-navy-900 bg-white px-2.5 py-1 text-[11px] text-navy-900 md:left-5 md:top-5">{card.pill}</span>
      <span className={cn("absolute -z-10", card.art.className)}>
        <VehicleArt kind={card.art.kind} paint={card.art.paint} className="w-full transition-transform duration-700 ease-out group-hover:-translate-x-[4%]" />
      </span>
      {card.sign && <Sign shape="round" big="Instant" i={5} className="absolute right-[5%] top-[5%] z-20 rotate-[10deg] text-[14px] md:text-[18px]" />}
      <span className={cn("display pr-10 text-[3.9rem] md:pr-0 md:text-[5rem]", card.labelClass)}>{card.label}</span>
      {card.caption && <span className="mt-2 max-w-[15rem] pr-12 text-sm font-medium opacity-90">{card.caption}</span>}
      <span className={cn("absolute bottom-4 right-4 z-20 grid size-11 place-items-center rounded-xl transition duration-300 group-hover:-rotate-45 md:bottom-5 md:right-5", card.arrow)}>
        <ArrowRight className="size-5" aria-hidden="true" />
      </span>
    </>
  )
  return (
    <motion.div variants={tileIn} custom={i} className={cn("h-[25rem] w-[80vw] max-w-[22rem] shrink-0 snap-center md:h-auto md:w-auto md:max-w-none", card.span)}>
      <Tilt className="h-full">
        {card.to.startsWith("#") ? (
          <a href={card.to} className={className}>
            {inner}
          </a>
        ) : (
          <Link to={card.to} className={className}>
            {inner}
          </Link>
        )}
      </Tilt>
    </motion.div>
  )
}

export function Gets() {
  return (
    <motion.section {...reveal(0.12)} className="bg-surface pb-16 pt-14 md:pb-24 md:pt-24">
      <Container>
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <motion.h2 variants={rise} className="display text-[clamp(3.4rem,8vw,7.4rem)]">
              One sticker.
              <br />
              Reachable, <span className="text-coral-600">not exposed.</span>
            </motion.h2>
            <LaneLine className="mt-5 text-[10px] text-navy-900 md:text-[13px]" />
          </div>
          <motion.div variants={rise} custom={2} className="md:col-span-4 md:pb-2">
            <p className="max-w-[40ch] text-ink-600">A QR for your windscreen, a page that tells you what's wrong, and a private chat that keeps your number to yourself.</p>
            <Link to={CREATE_PATH} className="label-caps group mt-3 flex min-h-12 items-center justify-between border-b-2 border-navy-900 text-sm transition-colors hover:text-coral-700">
              {CREATE_QR}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </Container>

      <div className="snap-row mx-auto mt-10 flex max-w-[1240px] snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 md:mt-14 md:grid md:h-[39rem] md:grid-cols-12 md:grid-rows-2 md:gap-5 md:overflow-visible md:px-8">
        {cards.map((card, i) => (
          <GetCard key={card.label} card={card} i={i} />
        ))}
      </div>
    </motion.section>
  )
}
