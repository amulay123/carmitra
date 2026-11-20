import { motion, type MotionValue } from "motion/react"
import { useId } from "react"

import { cn } from "@/lib/utils"

/*
 * The vehicles are drawn here, not photographed: a photo of a real car carries its maker's
 * badge and a number plate. Each drawing faces right; flip it with -scale-x-100.
 *
 * `spin` turns the wheels, in degrees. Hand it a motion value tied to scrolling.
 */

export const paints = {
  green: { body: "#3ccb35", shade: "#2a9f25", lamp: "#ffffff" },
  coral: { body: "#e0412f", shade: "#b5311f", lamp: "#fff4c2" },
  salmon: { body: "#f3877a", shade: "#d9695b", lamp: "#ffffff" },
  sky: { body: "#a9c1f6", shade: "#7f9de0", lamp: "#ffffff" },
  navy: { body: "#1f3a5c", shade: "#0d1b2e", lamp: "#fff4c2" },
  cream: { body: "#fffaf3", shade: "#e6d6be", lamp: "#3ccb35" },
  white: { body: "#ffffff", shade: "#d5d9e2", lamp: "#fff4c2" },
  silver: { body: "#c9ced8", shade: "#a1a8b6", lamp: "#fff4c2" },
  red: { body: "#c2382e", shade: "#9e2b23", lamp: "#fff4c2" },
  blue: { body: "#2f55d4", shade: "#2040a8", lamp: "#fff4c2" },
  darkgreen: { body: "#0c5e33", shade: "#08432a", lamp: "#fff4c2" },
  brown: { body: "#7a5236", shade: "#5c3d27", lamp: "#fff4c2" },
  yellow: { body: "#ffcb05", shade: "#e0ae00", lamp: "#ffffff" },
  orange: { body: "#ff7a1f", shade: "#dd5f0b", lamp: "#ffffff" },
  black: { body: "#2a2d33", shade: "#15171b", lamp: "#fff4c2" },
}
export type Paint = keyof typeof paints

/** The drawing's paint for each colour an owner can choose. */
export const paintForColour: Record<string, Paint> = {
  White: "white",
  Silver: "silver",
  Grey: "silver",
  Black: "black",
  Red: "red",
  Blue: "blue",
  Brown: "brown",
  Green: "darkgreen",
  Yellow: "yellow",
  Orange: "orange",
}

const TYRE = "#08111e"
const RIM = "#5b7096"
const INK = "#0d1b2e"
const GLASS = "#142842"
const TAIL = "#e0412f"

type Spin = MotionValue<number> | number

function Wheel({ x, y, r, spin }: { x: number; y: number; r: number; spin?: Spin }) {
  const holes = [0, 72, 144, 216, 288]
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r - 1.5} fill={TYRE} stroke={RIM} strokeWidth="3" />
      {/* The hub is one group, so it turns about its own centre. */}
      <motion.g style={{ rotate: spin ?? 0 }}>
        <circle r={r * 0.56} fill="#fff8ef" />
        {holes.map((angle) => (
          <circle key={angle} cx={Math.cos((angle * Math.PI) / 180) * r * 0.34} cy={Math.sin((angle * Math.PI) / 180) * r * 0.34} r={r * 0.1} fill={INK} />
        ))}
      </motion.g>
      <circle r={r * 0.13} fill={INK} />
    </g>
  )
}

/** A tiny QR sticker, for the windscreen. */
function MiniQr({ x, y, size }: { x: number; y: number; size: number }) {
  const u = size / 9
  const cells = [
    [1, 1, 2.6, 2.6],
    [5.4, 1, 2.6, 2.6],
    [1, 5.4, 2.6, 2.6],
    [4.2, 4.2, 1.2, 1.2],
    [5.8, 5.8, 1.2, 1.2],
    [6.8, 4.4, 1.1, 1.1],
    [4.4, 6.8, 1.1, 1.1],
  ]
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={size} height={size} rx={size * 0.2} fill="#ffffff" />
      {cells.map(([cx, cy, w, h]) => (
        <rect key={`${cx}-${cy}`} x={cx * u} y={cy * u} width={w * u} height={h * u} rx={u * 0.25} fill={INK} />
      ))}
    </g>
  )
}

const shapes = {
  car: {
    viewBox: "0 0 648 274",
    body: "M34 206 C30 176 40 152 64 142 L104 134 C132 92 178 64 246 60 L352 60 C408 62 448 92 482 132 L566 146 C598 152 614 172 614 198 L614 214 C614 226 606 236 594 236 L536 236 A58 58 0 0 0 420 236 L226 236 A58 58 0 0 0 110 236 L54 236 C42 236 36 226 34 206 Z",
    glass: "M126 134 C152 100 192 80 246 78 L350 78 C394 80 428 104 456 134 Z",
    pillar: { x: 292, y: 74, width: 15, height: 64 },
    seam: "M300 138 L300 232",
    handle: { x: 328, y: 154, width: 36, height: 10 },
    mirror: { cx: 468, cy: 132, rx: 15, ry: 10 },
    lamp: { cx: 596, cy: 178, rx: 15, ry: 11 },
    tail: { x: 38, y: 160, width: 13, height: 28 },
    sill: 206,
    wheels: [
      { x: 168, y: 228, r: 42 },
      { x: 478, y: 228, r: 42 },
    ],
    qr: { x: 398, y: 92, size: 30 },
  },
  suv: {
    viewBox: "0 0 652 278",
    body: "M30 208 C28 168 36 138 60 126 L88 118 C100 82 136 52 198 48 L392 48 C438 50 466 82 490 122 L574 136 C604 142 618 164 618 196 L618 218 C618 230 610 240 598 240 L544 240 A62 62 0 0 0 420 240 L232 240 A62 62 0 0 0 108 240 L52 240 C40 240 32 230 30 208 Z",
    glass: "M112 122 C124 92 152 68 198 66 L388 66 C426 68 446 94 464 122 Z",
    pillar: { x: 288, y: 62, width: 16, height: 64 },
    seam: "M296 126 L296 236",
    handle: { x: 324, y: 144, width: 38, height: 10 },
    mirror: { cx: 476, cy: 122, rx: 16, ry: 11 },
    lamp: { cx: 600, cy: 172, rx: 15, ry: 12 },
    tail: { x: 34, y: 150, width: 13, height: 32 },
    sill: 204,
    wheels: [
      { x: 170, y: 230, r: 46 },
      { x: 482, y: 230, r: 46 },
    ],
    qr: { x: 404, y: 80, size: 30 },
  },
}

function Car({ kind, paint, spin }: { kind: "car" | "suv"; paint: Paint; spin?: Spin }) {
  const id = useId()
  const { body, shade, lamp } = paints[paint]
  const shape = shapes[kind]
  return (
    <>
      <clipPath id={`${id}body`}>
        <path d={shape.body} />
      </clipPath>
      <clipPath id={`${id}glass`}>
        <path d={shape.glass} />
      </clipPath>
      <path d={shape.body} fill={body} />
      <g clipPath={`url(#${id}body)`}>
        <rect x="0" y={shape.sill} width="660" height="60" fill={shade} />
        <rect {...shape.tail} rx="6" fill={TAIL} />
        <ellipse {...shape.lamp} fill={lamp} />
      </g>
      <path d={shape.glass} fill={GLASS} />
      {/* A band of light across the glass */}
      <path d="M190 40 L236 40 L176 150 L130 150 Z" fill="#ffffff" opacity="0.14" clipPath={`url(#${id}glass)`} />
      <rect {...shape.pillar} fill={body} />
      <path d={shape.seam} stroke={shade} strokeWidth="3" strokeLinecap="round" />
      <rect {...shape.handle} rx="5" fill={shade} />
      <ellipse {...shape.mirror} fill={shade} />
      {kind === "suv" && <path d="M176 44 L404 44" stroke={shade} strokeWidth="7" strokeLinecap="round" />}
      <MiniQr {...shape.qr} />
      {shape.wheels.map((wheel) => (
        <Wheel key={wheel.x} {...wheel} spin={spin} />
      ))}
    </>
  )
}

function Scooter({ paint, spin }: { paint: Paint; spin?: Spin }) {
  const { body, shade, lamp } = paints[paint]
  return (
    <>
      {/* Mirror and handlebar */}
      <path d="M306 96 L292 54" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="288" cy="48" rx="15" ry="10" fill={INK} />
      <path d="M318 100 L268 84" stroke={INK} strokeWidth="12" strokeLinecap="round" />
      {/* Fork, behind the front panel */}
      <path d="M322 200 L340 322" stroke={INK} strokeWidth="12" strokeLinecap="round" />
      <Wheel x={104} y={322} r={40} spin={spin} />
      <Wheel x={340} y={322} r={40} spin={spin} />
      {/* Seat */}
      <rect x="70" y="170" width="158" height="34" rx="17" fill={INK} />
      {/* Rear body, over the top of the rear wheel */}
      <path d="M34 262 C34 222 68 196 124 196 L226 196 L200 290 C196 302 186 308 174 308 L62 308 C44 308 34 292 34 262 Z" fill={body} />
      <path d="M36 276 C40 298 48 308 62 308 L174 308 C186 308 196 302 200 290 L204 276 Z" fill={shade} />
      <rect x="30" y="232" width="12" height="26" rx="6" fill={TAIL} />
      {/* Front panel, running down into the footboard */}
      <path d="M296 92 L334 92 C350 150 358 214 348 262 C344 284 330 298 308 302 L196 308 L204 280 L268 280 C272 214 280 150 296 92 Z" fill={body} />
      <path d="M204 280 L268 280 C270 262 271 250 272 240 L300 240 C300 262 296 284 290 304 L196 308 Z" fill={shade} />
      {/* Front mudguard */}
      <path d="M288 322 A52 52 0 0 1 392 322 L378 322 A38 38 0 0 0 302 322 Z" fill={body} />
      {/* Headlamp */}
      <circle cx="338" cy="112" r="15" fill={lamp} stroke={INK} strokeWidth="5" />
      <MiniQr x={300} y={150} size={30} />
    </>
  )
}

type VehicleArtProps = {
  kind: "car" | "suv" | "scooter"
  paint?: Paint
  spin?: Spin
  className?: string
  /** Leave out for decoration; give it when the drawing is the only thing naming the vehicle. */
  label?: string
}

export function VehicleArt({ kind, paint = "coral", spin, className, label }: VehicleArtProps) {
  const viewBox = kind === "scooter" ? "0 0 430 366" : shapes[kind].viewBox
  return (
    <svg viewBox={viewBox} fill="none" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={cn("block h-auto overflow-visible", className)}>
      {kind === "scooter" ? <Scooter paint={paint} spin={spin} /> : <Car kind={kind} paint={paint} spin={spin} />}
    </svg>
  )
}
