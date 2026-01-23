"use client"
import React, { useState } from "react"
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

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      setMessage("Please provide username and password")
      return
    }
    if (password !== confirm) {
      setMessage("Passwords do not match")
      return
    }
    const users = getUsers()
    if (users[username]) {
      setMessage("User already exists")
      return
    }
    users[username] = password
    setUsers(users)
    setMessage("Account created — redirecting to login...")
    setTimeout(() => router.push("/auth"), 800)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-block">
          <div className="w-14 h-14 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold mx-auto">NS</div>
          <div className="text-sm text-gray-600 mt-2">NestSchool — Entry Check</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>
          {message && <div className="text-sm text-red-600">{message}</div>}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md">Create</button>
            <Link href="/auth" className="text-sm text-gray-600 underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
