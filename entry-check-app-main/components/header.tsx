"use client"

import { Bell, User, Menu } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase-client"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useSidebar } from "@/contexts/sidebar-context"

export function Header() {
  const pathname = usePathname()
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { setIsMobileOpen } = useSidebar()

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.email || user.uid)
        // Sync to localStorage/cookie in case it was missed
        localStorage.setItem("nest_current_user", user.email || user.uid)
      } else {
        setUsername(null)
      }
    })

    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDocClick)

    return () => {
      unsubscribe()
      document.removeEventListener("click", onDocClick)
    }
  }, [])

  async function handleLogout() {
    try {
      await signOut(auth)
      localStorage.removeItem("nest_current_user")
      // remove cookie so middleware will redirect unauthenticated
      document.cookie = "nest_current_user=; Path=/; Max-Age=0; SameSite=Lax"
    } catch (e) {
      console.error("Logout error:", e)
    }
    setUsername(null)
    setOpen(false)
    router.replace("/auth")
  }

  return (
    <header className="h-16 bg-white border-b border-nest-100 shadow-sm flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -ml-2 text-nest-600 hover:bg-nest-50 rounded-md md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-nest-800 tracking-tight hidden sm:block">
          {pathname === "/" ? "Admin Dashboard" : 
           pathname === "/students" ? "Students Directory" : 
           pathname === "/add-student" ? "Add Student" : 
           pathname === "/reports" ? "Reports" : 
           pathname === "/about" ? "About" : "Dashboard"}
        </h1>
      </div>
      
      <div className="flex-1" />
      <div className="flex items-center gap-4">

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-nest-600 hover:bg-nest-50 rounded-full transition-colors"
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
