"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthGate() {
  const router = useRouter()

  useEffect(() => {
    try {
      const pathname = window.location.pathname || "/"
      // don't redirect when already on auth pages
      if (pathname.startsWith("/auth")) return

      const current = localStorage.getItem("nest_current_user")
      if (!current) {
        router.replace("/auth")
      }
    } catch (e) {
      // noop
    }
  }, [router])

  return null
}
