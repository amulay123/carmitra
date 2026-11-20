import { cn } from "@/lib/utils"

/** A registration number drawn as a number plate. Size it with a font size: everything scales with it. */
export function Plate({ text, className }: { text: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`Number plate ${text.replace(/•+/g, "hidden")}`}
      className={cn("inline-flex items-stretch overflow-hidden rounded-[0.26em] border-[0.09em] border-navy-900 bg-white font-display font-black leading-none text-navy-900 [font-stretch:84%]", className)}
    >
      {/* The blue band of an Indian plate. The one colour here that isn't from the palette. */}
      <span aria-hidden="true" className="flex w-[0.6em] items-end justify-center bg-[#1c3faa] pb-[0.2em]">
        <span className="text-[0.2em] font-bold tracking-wide text-white">IND</span>
      </span>
      <span aria-hidden="true" className="whitespace-nowrap px-[0.38em] pb-[0.22em] pt-[0.28em] tracking-[0.04em]">
        {text}
      </span>
    </span>
  )
}
