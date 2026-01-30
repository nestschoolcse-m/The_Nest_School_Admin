"use client"

import { Bell, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Header() {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const u = typeof window !== "undefined" ? localStorage.getItem("nest_current_user") : null
    setUsername(u)

    function onStorage(e: StorageEvent) {
      if (e.key === "nest_current_user") setUsername(e.newValue)
    }
    window.addEventListener("storage", onStorage)

    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDocClick)

    return () => {
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("click", onDocClick)
    }
  }, [])

  function handleLogout() {
    try {
      localStorage.removeItem("nest_current_user")
      // remove cookie so middleware will redirect unauthenticated
      document.cookie = "nest_current_user=; Path=/; Max-Age=0; SameSite=Lax"
    } catch (e) {
      // ignore
    }
    setUsername(null)
    setOpen(false)
    router.replace("/auth")
  }

  return (
    <header className="h-16 bg-gradient-to-r from-teal-400 to-teal-300 flex items-center justify-between px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-white font-medium">{currentDate}</span>
        

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="User menu"
          >
            <User className="w-5 h-5" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 text-left z-50">
              <div className="px-4 py-3 text-sm text-gray-700">
                {username ? (
                  <div>
                    <div className="font-medium">{username}</div>
                    <div className="text-xs text-gray-500">Signed in</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Not signed in</div>
                )}
              </div>
              <div className="border-t border-gray-100" />
              <div className="py-2">
                {username ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/auth" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
