"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase-client"
import { onAuthStateChanged } from "firebase/auth"

export default function AuthGate() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Don't redirect when already on auth pages
      if (pathname?.startsWith("/auth")) return

      if (!user) {
        // Double check localStorage in case of delay/race condition, 
        // but Firebase Auth state is the source of truth for Firestore rules
        const current = localStorage.getItem("nest_current_user")
        if (!current) {
          router.replace("/auth")
        }
      } else {
        // Sync back to localStorage just in case it was cleared but session persists
        localStorage.setItem("nest_current_user", user.email || user.uid)
        // Sync cookie for middleware
        document.cookie = `nest_current_user=${encodeURIComponent(user.email || user.uid)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  return null
}
