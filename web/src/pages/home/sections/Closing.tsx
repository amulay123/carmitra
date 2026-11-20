import { ArrowUp, ArrowUpRight, Bike, EyeOff, ScanLine } from "lucide-react"
import { motion, type Variants } from "motion/react"
import { Link } from "react-router-dom"

import { Wordmark } from "@/components/brand/Wordmark"
import { buttonVariants } from "@/components/ui/button"
import { VehicleArt } from "@/components/vehicle/VehicleArt"
import { petSafeUrl, weSafeUrl } from "@/lib/utils"

import { Container, EASE, Lane, Magnetic, reveal, rise } from "../parts"
import { CREATE_PATH, CREATE_QR } from "../sample"

const YEAR = new Date().getFullYear()

const faqs = [
  ["Does the person scanning need an app?", "No. Any phone camera that reads QR codes opens your vehicle's page in the browser."],
  ["Can people see my mobile number?", "Only if you choose to show it. Every vehicle starts as chat only, where your number never appears. If you switch on Show my number, anyone who scans the sticker can see it and call it."],
  ["How does the private chat work?", "The person scanning picks a reason and can type a message. You get a WhatsApp alert with a link, and you reply from there. Neither of you sees the other's number."],
  ["What if someone misuses the chat?", "You can block them. Chats also close on their own after 24 hours, and there is a limit on how many messages one person can send."],
  ["What if I sell the vehicle?", "Remove it from your account and its QR stops working. The new owner can set up their own."],
  ["I already use WeSafe QR or PetSafe QR. Do I need a new account?", "No. Sign in with the same Google account or mobile number you use there."],
]

export function Questions() {
  return (
    <motion.section id="questions" {...reveal(0.1)} className="border-t-2 border-navy-900 bg-surface py-16 md:py-28">
      <Container>
        <motion.h2 variants={rise} className="display text-[clamp(3.4rem,7.4vw,6.8rem)]">
          Good questions.
        </motion.h2>
        <dl className="mt-10 grid gap-x-14 md:grid-cols-2">
          {faqs.map(([question, answer], i) => (
            <motion.div key={question} variants={rise} custom={1 + (i >> 1) * 1.4} className="border-t-2 border-navy-900 py-6">
              <dt className="font-display text-xl font-extrabold leading-snug [font-stretch:88%] md:text-2xl">{question}</dt>
              <dd className="mt-2 max-w-[60ch] leading-relaxed text-ink-600">{answer}</dd>
            </motion.div>
          ))}
        </dl>
      </Container>
    </motion.section>
  )
}

const HEADLINE = ["Give", "your", "car", "a", "voice."]

const wordIn: Variants = {
  hidden: { y: "70%", opacity: 0, rotate: 5 },
  shown: (i: number) => ({ y: 0, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 170, damping: 17, delay: i * 0.09 } }),
}

/** The vehicles drive in along the road, from the side each one is given. */
const driveIn: Variants = {
  hidden: (from: number) => ({ x: `${from * 130}%`, opacity: 0 }),
  shown: (from: number) => ({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 60, damping: 15, delay: 0.5 + Math.abs(from) * 0.12 } }),
}

export function Closing() {
  return (
    <>
      <div aria-hidden="true" className="kerb" />
      <motion.section {...reveal(0.25)} className="relative overflow-hidden bg-navy-900 pt-16 text-center text-white md:pt-24">
        <Container className="flex flex-col items-center">
          <h2 aria-label="Give your car a voice." className="display text-[clamp(4.2rem,13.5vw,12.5rem)] text-brand-400">
            {HEADLINE.map((word, i) => (
              <motion.span key={word} aria-hidden="true" variants={wordIn} custom={i} className="mr-[0.2em] inline-block last:mr-0">
                {word}
              </motion.span>
            ))}
          </h2>
          <motion.p variants={rise} custom={5} className="mt-5 max-w-[36ch] text-lg leading-snug text-white/85">
            Set it up once. After that, anyone who needs you can reach you.
          </motion.p>
          <motion.div variants={rise} custom={6} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link to={CREATE_PATH} className={buttonVariants({ variant: "onDark", size: "lg" })}>
                {CREATE_QR}
              </Link>
            </Magnetic>
            <Link to="/auth" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          </motion.div>
        </Container>

        {/* Three vehicles on the road that the footer sits under. */}
        <div className="relative mt-10 h-[11rem] md:mt-14 md:h-[19rem]">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[42%] bg-navy-800">
            <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15" />
            <Lane className="absolute inset-x-0 top-[44%] text-brand-400" />
          </div>
          <div className="relative mx-auto h-full max-w-[1240px]">
            <motion.div variants={driveIn} custom={-1} className="absolute bottom-[30%] left-[-6%] w-[46%] md:left-[2%] md:w-[33%]">
              <VehicleArt kind="suv" paint="cream" className="w-full" />
            </motion.div>
            <motion.div variants={driveIn} custom={1.6} className="absolute bottom-[30%] right-[2%] w-[17%] md:right-[7%] md:w-[12%]">
              <VehicleArt kind="scooter" paint="sky" className="w-full -scale-x-100" />
            </motion.div>
            <motion.div variants={driveIn} custom={1} className="absolute bottom-[30%] left-[38%] w-[44%] md:left-[40%] md:w-[36%]">
              <VehicleArt kind="car" paint="coral" className="w-full -scale-x-100" />
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  )
}

const footerColumns: { title: string; links: { label: string; to: string; note?: string }[] }[] = [
  {
    title: "Carmitra",
    links: [
      { label: "What a scanner sees", to: "#scanner" },
      { label: "How it works", to: "#steps" },
      { label: "Private chat", to: "#chat" },
      { label: "Questions", to: "#questions" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: CREATE_QR, to: CREATE_PATH },
      { label: "Sign in", to: "/auth" },
      { label: "Link a sticker", to: "/app/link-sticker" },
      { label: "Get a printed sticker", to: "/app/get-sticker" },
    ],
  },
  {
    title: "The WeSafe family",
    links: [
      { label: "WeSafe QR", to: weSafeUrl, note: "For people" },
      { label: "PetSafe QR", to: petSafeUrl, note: "For pets" },
    ],
  },
]

const promises = [
  { icon: ScanLine, text: "No app needed to scan" },
  { icon: EyeOff, text: "Number hidden by default" },
  { icon: Bike, text: "Cars, bikes and scooters" },
]

const wordmarkUp: Variants = {
  hidden: { y: "45%", opacity: 0 },
  shown: { y: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } },
}

function FooterLink({ label, to, note }: { label: string; to: string; note?: string }) {
  const className = "group inline-flex min-h-11 flex-col justify-center font-semibold text-navy-900 transition-colors hover:text-coral-700"
  const text = (
    <>
      <span className="inline-flex items-center gap-1">
        {label}
        {to.startsWith("http") && <ArrowUpRight className="size-3.5 opacity-50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />}
      </span>
      {note && <span className="text-xs font-normal text-ink-500">{note}</span>}
    </>
  )
  if (to.startsWith("http")) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {text}
      </a>
    )
  }
  if (to.startsWith("#")) {
    return (
      <a href={to} className={className}>
        {text}
      </a>
    )
  }
  return (
    <Link to={to} className={className}>
      {text}
    </Link>
  )
}

export function Footer() {
  return (
    <motion.footer {...reveal(0.1)} className="relative z-10 overflow-hidden bg-surface">
      <Container className="pt-14 md:pt-20">
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
          <motion.div variants={rise} className="flex flex-col items-start gap-5 lg:col-span-5">
            <Wordmark className="text-[2rem]" />
            <p className="max-w-[34ch] text-lg leading-snug text-navy-800">A QR sticker that lets anyone reach a vehicle's owner, without either of them sharing a number.</p>
            <ul className="flex flex-wrap gap-2">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy-900 bg-white px-3 py-1.5 text-[13px] font-semibold text-navy-900">
                  <Icon className="size-3.5 text-brand-600" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7">
            {footerColumns.map((column, i) => (
              <motion.div key={column.title} variants={rise} custom={1 + i}>
                <h2 className="label-caps text-[12px] text-ink-500 [font-stretch:92%]">{column.title}</h2>
                <ul className="mt-3 flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* A lane line in place of a rule. */}
        <div aria-hidden="true" className="lane mt-14 h-[5px] text-navy-900" />
        <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-ink-600">
          <p>© {YEAR} Carmitra. Part of the WeSafe QR family.</p>
          <button type="button" onClick={() => window.scrollTo(0, 0)} className="label-caps group inline-flex min-h-11 items-center gap-1.5 text-[13px] text-navy-900 hover:text-coral-700">
            Back to top
            <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </Container>

      {/* The logo, oversized and cut off by the bottom of the page: MITRA on its green plate. */}
      <div aria-hidden="true" className="relative select-none">
        <motion.div variants={wordmarkUp} className="display -mb-[0.2em] flex items-start justify-center gap-[0.05em] whitespace-nowrap px-[2vw] text-[20.5vw] leading-[0.8] text-navy-900 [font-stretch:62%]">
          <span className="pt-[0.07em]">Car</span>
          <span className="rounded-[0.09em] border-[0.035em] border-navy-900 bg-brand-400 px-[0.06em] pt-[0.07em]">mitra</span>
        </motion.div>
      </div>
    </motion.footer>
  )
}
