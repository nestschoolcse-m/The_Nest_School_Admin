"use client"

import { Bell, User } from "lucide-react"

export function Header() {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <header className="h-16 bg-gradient-to-r from-teal-400 to-teal-300 flex items-center justify-between px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-white font-medium">{currentDate}</span>
        <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
