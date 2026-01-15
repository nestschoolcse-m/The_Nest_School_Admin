import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  className?: string
  iconClassName?: string
  valueClassName?: string
}

export function StatCard({ icon: Icon, label, value, className, iconClassName, valueClassName }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 min-w-[140px]",
        className,
      )}
    >
      <Icon className={cn("w-8 h-8", iconClassName)} />
      <span className="text-sm text-teal-600 font-medium text-center">{label}</span>
      <span className={cn("text-2xl font-bold", valueClassName)}>{value}</span>
    </div>
  )
}
