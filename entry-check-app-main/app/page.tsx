"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardContent from "./dashboard/Content"

export default function Page() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const current = localStorage.getItem("nest_current_user")
      if (!current) {
        router.replace("/auth")
        return
      }
      setReady(true)
    } catch (e) {
      router.replace("/auth")
    }
  }, [router])

  if (!ready) return null
  return <DashboardContent />
}
