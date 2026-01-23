"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("nest_users") || "{}")
  } catch {
    return {}
  }
}

function setUsers(users: Record<string, string>) {
  localStorage.setItem("nest_users", JSON.stringify(users))
}

export default function AuthLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Ensure default user exists
    const users = getUsers()
    if (!users["nestschool"]) {
      users["nestschool"] = "nestschool"
      setUsers(users)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const users = getUsers()
    if (users[username] && users[username] === password) {
      // mark as logged in (localStorage + cookie for middleware)
      localStorage.setItem("nest_current_user", username)
      // set cookie so Next.js middleware can detect session on the server
      try {
        document.cookie = `nest_current_user=${encodeURIComponent(username)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
      } catch (e) {
        // ignore
      }
      setMessage("Login successful — redirecting...")
      // pretend-protected route: redirect to home
      setTimeout(() => router.push("/"), 600)
    } else {
      setMessage("Invalid username or password")
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        {/* logo */}
        <div className="inline-block">
          <div className="w-14 h-14 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold mx-auto">NS</div>
          <div className="text-sm text-gray-600 mt-2">NestSchool — Entry Check</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sign in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>

          {message && <div className="text-sm text-red-600">{message}</div>}

          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md">Sign in</button>
            <Link href="/auth/forgot" className="text-sm text-purple-600 underline">Forgot password?</Link>
          </div>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          No account? <Link href="/auth/signup" className="text-purple-600 underline">Create one</Link>
        </div>
      </div>
    </div>
  )
}
