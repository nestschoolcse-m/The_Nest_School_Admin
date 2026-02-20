"use client"
import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth } from "@/lib/firebase-client"
import { onAuthStateChanged } from "firebase/auth"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If user is on /auth pages, allow showing them regardless of auth
      if (pathname?.startsWith("/auth")) {
        setChecked(true)
        return
      }

      // If not authenticated, redirect to /auth
      if (!user) {
        // Fallback check for localStorage during transition/refresh
        const current = localStorage.getItem("nest_current_user")
        if (!current) {
          router.replace("/auth")
          return
        }
      }

      setChecked(true)
    })

    return () => unsubscribe()
  }, [pathname, router])

  if (!checked) return null

  // When on auth pages, render children without chrome
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  // Otherwise render normal sidebar/header layout
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="bg-gray-50 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
