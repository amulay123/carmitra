import { Check, CheckCheck, MessageSquareLock } from "lucide-react"
import { motion, type Variants } from "motion/react"

import { VehicleArt } from "@/components/vehicle/VehicleArt"
import { cn } from "@/lib/utils"

import { AlertCard, Container, draw, Float, pop, reveal, rise, Sign } from "../parts"

const facts = ["A WhatsApp alert when someone messages you", "No phone numbers exchanged, on either side", "Chats close after 24 hours, and you can block anyone"]

/** A sample conversation. "them" is the person at the vehicle; "you" is the owner. */
const thread = [
  { from: "them", text: "Your car is blocking mine. Could you move it?" },
  { from: "you", text: "Sorry about that. Coming down now." },
  { from: "them", text: "Thank you!" },
] as const

/** Each message arrives after the one before it. */
const bubbleIn: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.9 },
  shown: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20, delay: 0.5 + i * 0.75 } }),
}

const scooterIn: Variants = {
  hidden: { opacity: 0, x: 140 },
  shown: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 80, damping: 15, delay: 0.15 } },
}

const ROAD = "M-160 452 C 40 470, 210 458, 300 404 C 380 356, 470 340, 720 348"

export function Chat() {
  return (
    <>
      <div aria-hidden="true" className="kerb" />

      <motion.section id="chat" {...reveal(0.2)} className="overflow-hidden bg-sky-200 pt-12 md:pt-20">
        <Container className="grid items-end gap-x-10 gap-y-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5 pb-4 lg:pb-28">
            <motion.h2 variants={rise} className="display text-[clamp(3.4rem,7.4vw,6.8rem)]">
              Talk it out. Keep your number.
            </motion.h2>
            <motion.p variants={rise} custom={1} className="max-w-[44ch] text-lg leading-snug text-navy-800">
              The person at your vehicle types on the page they scanned. You reply from the link in your WhatsApp alert.
            </motion.p>
            <ul className="flex flex-col gap-2.5">
              {facts.map((fact, i) => (
                <motion.li key={fact} variants={rise} custom={i + 2} className="flex items-start gap-3 font-medium">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-navy-900 text-brand-400">
                    <Check className="size-3.5" strokeWidth={3.5} aria-hidden="true" />
                  </span>
                  {fact}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto h-[31rem] w-full max-w-[32rem] md:h-[33rem]">
            {/* A road for the scooter, with its lane line. */}
            <svg aria-hidden="true" viewBox="0 0 520 520" fill="none" className="absolute inset-x-[-12%] bottom-0 w-[124%] overflow-visible">
              <motion.path variants={draw} d={ROAD} stroke="var(--color-navy-900)" strokeWidth={54} strokeLinecap="round" />
              <motion.path variants={rise} custom={12} d={ROAD} stroke="var(--color-brand-400)" strokeWidth={5} strokeDasharray="26 22" />
            </svg>

            <motion.div variants={scooterIn} className="absolute bottom-[10.5%] right-[-3%] w-[40%] md:bottom-[12.5%] md:right-[-1%] md:w-[38%]">
              <VehicleArt kind="scooter" paint="coral" className="w-full -scale-x-100" />
            </motion.div>

            {/* The conversation, as either side sees it. */}
            <div aria-label="A sample private chat" role="img" className="absolute left-0 top-[3%] w-[80%] rounded-[22px] border-2 border-navy-900 bg-white p-4 shadow-hard md:left-[1%] md:top-[5%] md:w-[72%] md:p-5">
              <p className="flex items-center gap-2 border-b-2 border-navy-900/10 pb-3 text-sm font-semibold">
                <span className="grid size-8 place-items-center rounded-lg bg-navy-900 text-brand-400">
                  <MessageSquareLock className="size-4" aria-hidden="true" />
                </span>
                Private chat
                <span className="ml-auto rounded-md border border-line-strong bg-surface px-2 py-1 text-xs font-semibold text-navy-800">MH •• 1234</span>
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {thread.map((message, i) => (
                  <motion.p
                    key={message.text}
                    variants={bubbleIn}
                    custom={i}
                    className={cn(
                      "max-w-[86%] rounded-[16px] px-3.5 py-2 text-[14px] leading-snug",
                      message.from === "you" ? "self-end rounded-br-sm bg-navy-900 text-white" : "self-start rounded-bl-sm bg-surface text-navy-900",
                    )}
                  >
                    {message.text}
                  </motion.p>
                ))}
                <motion.p variants={bubbleIn} custom={thread.length} className="flex items-center gap-1 self-end text-xs font-medium text-ink-500">
                  <CheckCheck className="size-3.5 text-brand-600" aria-hidden="true" />
                  Seen
                </motion.p>
              </div>
            </div>

            <Sign big="0" small="numbers shared" i={5} className="absolute right-[-1%] top-[1%] rotate-[8deg] text-[14px] md:right-[-6%] md:top-[2%] md:text-[19px]" />
            <motion.div variants={pop} custom={9} className="absolute bottom-[23%] left-[-2%] md:bottom-[30%] md:left-[-12%]">
              <Float delay={1.6}>
                <AlertCard icon={MessageSquareLock} title="New private message" text="Someone is at your car. Tap to reply." time="now" />
              </Float>
            </motion.div>
          </div>
        </Container>
      </motion.section>
    </>
  )
}
