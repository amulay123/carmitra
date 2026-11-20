import { motion, useScroll, useTransform, type Variants } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"
import { StickerArt } from "@/components/vehicle/StickerArt"
import { VehicleCard } from "@/components/vehicle/VehicleCard"
import { publicUrl } from "@/lib/utils"

import { Container, Magnetic, pop, reveal, rise, useCalm } from "../parts"
import { CREATE_PATH, CREATE_QR, SAMPLE_PLATE, sampleVehicle } from "../sample"

const steps = [
  { title: "Add your vehicle", text: "Its number, type and colour. No documents to upload.", note: "Car or bike" },
  { title: "Choose how people reach you", text: "A private chat only, or your number as well. Change it whenever you like.", note: "Your choice" },
  { title: "Stick the QR on", text: "Print it, request a sticker, or link a pre-printed one.", note: "CMT-7K2M-94" },
  { title: "Get the message", text: "Whoever scans it tells you what's wrong, and you get a WhatsApp alert.", note: "No app needed" },
]

const glassIn: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 16 } },
}

export function Steps() {
  const ref = useRef<HTMLElement>(null)
  const calm = useCalm()

  // The vehicle card swings and drifts as the section passes through the screen.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const cardTurn = useTransform(scrollYProgress, [0, 0.5, 1], calm ? [5, 5, 5] : [17, 5, -5])
  const cardY = useTransform(scrollYProgress, [0, 1], calm ? [0, 0] : [70, -70])
  const stickerY = useTransform(scrollYProgress, [0, 1], calm ? [0, 0] : [-18, 18])

  return (
    <motion.section id="steps" ref={ref} {...reveal(0.15)} className="overflow-hidden bg-navy-900 py-16 text-white md:py-28">
      <Container className="grid items-center gap-x-20 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative mx-auto w-full max-w-[26rem] pb-10 lg:pb-0">
          {/* A windscreen, with the sticker on the inside of the glass. */}
          <motion.div variants={glassIn} className="relative aspect-[3/4] overflow-hidden rounded-[24px] border-2 border-white/25 bg-gradient-to-br from-sky-300 via-sky-200 to-sky-50">
            <span aria-hidden="true" className="absolute -left-[30%] top-[-10%] h-[140%] w-[34%] rotate-[24deg] bg-white/40" />
            <span aria-hidden="true" className="absolute left-[18%] top-[-10%] h-[140%] w-[9%] rotate-[24deg] bg-white/30" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[15%] bg-navy-800" />
            <span aria-hidden="true" className="absolute bottom-[12%] left-[-6%] h-[5%] w-[84%] origin-left rotate-[-9deg] rounded-full bg-navy-950" />
            <motion.div style={{ y: stickerY }} className="absolute left-[8%] top-[8%] w-[60%] rotate-[-5deg] text-[11px] md:text-[13px]">
              <StickerArt cmtId={sampleVehicle.cmtId} qrValue={publicUrl} />
            </motion.div>
          </motion.div>
          <motion.div aria-hidden="true" inert style={{ rotate: cardTurn, y: cardY }} className="absolute -bottom-2 right-0 w-[17rem] origin-bottom-right scale-[0.66] md:-right-8 md:scale-[0.82] lg:bottom-8">
            <motion.div variants={pop} custom={4}>
              <VehicleCard profile={sampleVehicle} plate={SAMPLE_PLATE} qrValue={publicUrl} />
            </motion.div>
          </motion.div>
        </div>

        <div>
          <motion.h2 variants={rise} className="display text-[clamp(3.4rem,7.4vw,6.8rem)]">
            Set up once.
            <br />
            <span className="text-brand-400">Reachable for good.</span>
          </motion.h2>
          <motion.p variants={rise} custom={1} className="mt-5 max-w-[46ch] text-lg leading-snug text-white/70">
            Four steps, then the sticker does the talking.
          </motion.p>

          <ol className="mt-8">
            {steps.map((item, i) => (
              <motion.li key={item.title} variants={rise} custom={i + 2} className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 border-t-2 border-white/15 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span className="display grid size-11 place-items-center rounded-lg border-2 border-white/40 text-2xl leading-none transition-colors duration-200 group-hover:border-brand-400 group-hover:bg-brand-400 group-hover:text-navy-900">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-2xl font-extrabold transition-colors duration-200 group-hover:text-brand-400">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-white/65">{item.text}</p>
                </div>
                <span className="label-caps hidden text-xs text-white/60 sm:block">{item.note}</span>
              </motion.li>
            ))}
          </ol>

          <motion.div variants={rise} custom={6} className="mt-6">
            <Magnetic>
              <Link to={CREATE_PATH} className={buttonVariants({ variant: "onDark", size: "lg" })}>
                {CREATE_QR}
              </Link>
            </Magnetic>
          </motion.div>
        </div>
      </Container>
    </motion.section>
  )
}
