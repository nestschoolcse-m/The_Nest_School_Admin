import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  className?: string
  iconClassName?: string
  valueClassName?: string
  href?: string
}

export function StatCard({ icon: Icon, label, value, className, iconClassName, valueClassName, href }: StatCardProps) {
  const CardContent = (
    <div
      className={cn(
        "bg-white rounded-2xl p-6 shadow-sm ring-1 ring-nest-100 flex flex-col items-center justify-center gap-3 min-w-[140px] transition-all",
        href && "hover:bg-nest-50 hover:shadow-md hover:ring-nest-200 cursor-pointer",
        className,
      )}
    >
      <Icon className={cn("w-8 h-8", iconClassName)} />
      <span className="text-sm text-nest-600 font-semibold text-center uppercase tracking-wider">{label}</span>
      <span className={cn("text-3xl font-bold", valueClassName)}>{value}</span>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{CardContent}</Link>
  }

  return CardContent
}
