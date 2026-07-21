"use client"
import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StudentsProvider } from "@/contexts/students-context"
import { auth } from "@/lib/firebase-client"
import { onAuthStateChanged } from "firebase/auth"
import { DateProvider } from "@/contexts/date-context"
import { DashboardDataProvider } from "@/contexts/dashboard-data-context"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen w-full transition-all duration-300",
          isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <Header />
        <main className="flex-1 bg-gray-50 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (pathname?.startsWith("/auth")) {
        setChecked(true)
        return
      }

      if (!user) {
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

  if (pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  return (
    <StudentsProvider>
      <DateProvider>
        <DashboardDataProvider>
          <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        </DashboardDataProvider>
      </DateProvider>
    </StudentsProvider>
  )
}
