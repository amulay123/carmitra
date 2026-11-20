import { Car, type LucideIcon } from "lucide-react"
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from "motion/react"
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react"

import { VehicleArt } from "@/components/vehicle/VehicleArt"
import { cn } from "@/lib/utils"

/*
 * Motion for the home page, built on Motion (motion/react). The timing and the variants are
 * PetSafeQR's, so the two sites move alike. The shapes are Carmitra's own: road signs, lane
 * lines and a road, where PetSafeQR has stickers, a leash and paw prints.
 *
 * A block gets {...reveal()} and plays once when it scrolls into view. Elements inside it
 * take one of the variants below, with `custom={n}` to stagger them.
 *
 * People who ask their device to reduce motion get fades only: no sliding, springing,
 * parallax, tilting or looping. That is done by <MotionConfig reducedMotion={MOTION_MODE}>
 * in HomePage and by the useCalm() checks beside each scroll-linked or looping effect.
 * Adding ?motion=on to the address shows the full motion regardless, for reviewing the
 * page on a machine that has animation turned off.
 */

const previewFullMotion = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("motion") === "on"

export const MOTION_MODE = previewFullMotion ? "never" : "user"

/** True when movement should be held back for this visitor. */
export function useCalm(): boolean {
  const reduce = useReducedMotion()
  return !previewFullMotion && Boolean(reduce)
}

export const EASE = [0.16, 1, 0.3, 1] as const

export const reveal = (amount = 0.2) => ({ initial: "hidden", whileInView: "shown", viewport: { once: true, amount } }) as const

/** Fades up. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 44 },
  shown: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE, delay: i * 0.09 } }),
}

/** Springs in with a spin: signs and alerts. */
export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.2, rotate: -35 },
  shown: (i: number = 0) => ({ opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 280, damping: 15, delay: 0.15 + i * 0.1 } }),
}

/** A stroked SVG path that draws itself. */
export const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: (i: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.8, ease: EASE, delay: 0.25 + i * 0.1 }, opacity: { duration: 0.05, delay: 0.25 + i * 0.1 } },
  }),
}

/** Grows from its centre: large background shapes. */
export const bloom: Variants = {
  hidden: { opacity: 0, scale: 0.55 },
  shown: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 110, damping: 14, delay: 0.1 } },
}

/** One dash of a lane line being painted. */
const paint: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  shown: (i: number = 0) => ({ opacity: 1, scaleX: 1, transition: { duration: 0.4, ease: EASE, delay: 0.35 + i * 0.07 } }),
}

export const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto w-full max-w-[1240px] px-5 md:px-8", className)}>{children}</div>
)

type SignShape = "diamond" | "round" | "plate"

const signFrame: Record<SignShape, ReactNode> = {
  // A warning sign.
  diamond: <span className="absolute inset-[13%] rotate-45 rounded-[0.8em] border-[0.2em] border-navy-900 bg-brand-400 shadow-hard-sm" />,
  // An order sign: white, with a coloured ring.
  round: (
    <>
      <span className="absolute inset-0 rounded-full bg-navy-900 shadow-hard-sm" />
      <span className="absolute inset-[0.2em] rounded-full bg-salmon-400" />
      <span className="absolute inset-[0.62em] rounded-full bg-white" />
    </>
  ),
  // A dark plate.
  plate: <span className="absolute inset-x-0 inset-y-[15%] rounded-[0.7em] border-[0.2em] border-navy-900 bg-navy-900 shadow-[inset_0_0_0_0.13em_var(--color-brand-400),3px_3px_0_var(--color-navy-900)]" />,
}

/** A road sign. Size it with a font size: everything inside scales with it. */
export function Sign({ big, small, shape = "diamond", className, i = 0 }: { big: string; small?: string; shape?: SignShape; className?: string; i?: number }) {
  return (
    <motion.div
      variants={pop}
      custom={i}
      whileHover={{ scale: 1.1, rotate: -6 }}
      whileTap={{ scale: 0.94 }}
      className={cn("relative grid aspect-square w-[6.8em] place-items-center text-center", shape === "plate" ? "text-brand-400" : "text-navy-900", className)}
    >
      {signFrame[shape]}
      <span className={cn("relative flex flex-col items-center", shape === "diamond" ? "w-[58%]" : "w-[76%]")}>
        <span className="display whitespace-nowrap text-[1.6em]">{big}</span>
        {small && <span className="label-caps mt-[0.3em] text-[0.52em] leading-[1.15]">{small}</span>}
      </span>
    </motion.div>
  )
}

/** A steering wheel, drawn large behind things. */
export function SteeringWheel({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" fill="none" className={className} style={style}>
      <circle cx="50" cy="50" r="41" stroke="currentColor" strokeWidth="14" />
      <path d="M11 52 L89 52 M50 52 L50 90" stroke="currentColor" strokeWidth="13" />
      <circle cx="50" cy="52" r="15" fill="currentColor" />
    </svg>
  )
}

/** A short lane line under a headline, painted one dash at a time. Size it with a font size. */
export function LaneLine({ className, count = 6 }: { className?: string; count?: number }) {
  return (
    <div aria-hidden="true" className={cn("flex gap-[0.8em]", className)}>
      {Array.from({ length: count }, (_, i) => (
        <motion.span key={i} variants={paint} custom={i} className="h-[0.42em] w-[2.6em] origin-left rounded-full bg-current" />
      ))}
    </div>
  )
}

/** The dashes down the middle of a road, moving as if the road were passing underneath. */
export function Lane({ className }: { className?: string }) {
  const calm = useCalm()
  return (
    <motion.div
      aria-hidden="true"
      className={cn("lane", className)}
      animate={calm ? undefined : { backgroundPositionX: ["0px", "-92px"] }}
      transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
    />
  )
}

/** A strip of road between two sections. A car drives along it as the page scrolls. */
export function Road({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const still = useCalm() ? 0 : 1
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const x = useTransform(scrollYProgress, [0, 1], still ? ["-22vw", "104vw"] : ["12vw", "12vw"])
  const spin = useTransform(scrollYProgress, [0, 1], [0, 1500 * still])
  return (
    <div ref={ref} aria-hidden="true" className={cn("relative overflow-x-clip", className)}>
      <motion.div style={{ x }} className="absolute bottom-[58%] left-0 z-10 w-36 md:w-56">
        <VehicleArt kind="car" paint="coral" spin={spin} className="w-full" />
      </motion.div>
      <div className="relative h-14 bg-navy-900 md:h-20">
        <Lane className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-brand-400" />
      </div>
    </div>
  )
}

/** An alert as the owner receives it. */
export function AlertCard({ title, text, time, icon: Icon = Car, className }: { title: string; text: string; time: string; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex w-[min(19rem,78vw)] items-start gap-3 rounded-2xl border-2 border-navy-900 bg-white p-3 text-left text-navy-900 shadow-hard", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-navy-900 bg-brand-400">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2 text-sm font-semibold">
          {title}
          <span className="shrink-0 text-xs font-normal text-ink-500">{time}</span>
        </p>
        <p className="text-[13px] leading-snug text-ink-600">{text}</p>
      </div>
    </div>
  )
}

/** Bobs gently, like a notification that has just arrived. */
export function Float({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const calm = useCalm()
  return (
    <motion.div animate={calm ? undefined : { y: [0, -8, 0] }} transition={{ duration: 4.6, ease: "easeInOut", repeat: Infinity, delay }}>
      {children}
    </motion.div>
  )
}

/** Leans towards the mouse pointer: for the main call to action. */
export function Magnetic({ children, pull = 0.28, className }: { children: ReactNode; pull?: number; className?: string }) {
  const calm = useCalm()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.5 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.5 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (calm || e.pointerType !== "mouse") return
    const box = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (box.left + box.width / 2)) * pull)
    y.set((e.clientY - (box.top + box.height / 2)) * pull)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("inline-block", className)}>
      {children}
    </motion.div>
  )
}

/** Tilts in 3D to follow the mouse pointer: for the tiles. */
export function Tilt({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const calm = useCalm()
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (calm || e.pointerType !== "mouse") return
    const box = e.currentTarget.getBoundingClientRect()
    rotateX.set(((e.clientY - box.top) / box.height - 0.5) * -max)
    rotateY.set(((e.clientX - box.left) / box.width - 0.5) * max)
  }
  const onLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div style={{ rotateX, rotateY, transformPerspective: 1100 }} onPointerMove={onMove} onPointerLeave={onLeave} className={className}>
      {children}
    </motion.div>
  )
}
