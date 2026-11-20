import logo from "@/assets/brand/tommyandfurry.jpg"
import { cn, tommyAndFurryUrl } from "@/lib/utils"

/** TommyAndFurry Insurance's logo, on the white it was drawn on, linking to its site. */
export function PartnerMark({ className, label = "In partnership with" }: { className?: string; label?: string }) {
  return (
    <a
      href={tommyAndFurryUrl}
      target="_blank"
      rel="noreferrer"
      className={cn("group inline-flex flex-col items-start gap-1.5 rounded-2xl border-2 border-navy-900 bg-white px-4 pb-3 pt-2.5 shadow-hard-sm transition-transform hover:-translate-y-0.5", className)}
    >
      <span className="label-caps text-[11px] text-ink-500">{label}</span>
      <img src={logo} alt="TommyAndFurry Insurance" width={784} height={242} loading="lazy" className="h-10 w-auto md:h-12" />
    </a>
  )
}
