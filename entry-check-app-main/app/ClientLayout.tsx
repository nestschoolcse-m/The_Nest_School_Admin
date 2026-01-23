"use client"
import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check auth status from localStorage
    const current = typeof window !== "undefined" ? localStorage.getItem("nest_current_user") : null

    // If user is on /auth pages, allow showing them regardless of auth
    if (pathname?.startsWith("/auth")) {
      setChecked(true)
      return
    }

    // If not authenticated, redirect to /auth
    if (!current) {
      router.replace("/auth")
      return
    }

    setChecked(true)
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
