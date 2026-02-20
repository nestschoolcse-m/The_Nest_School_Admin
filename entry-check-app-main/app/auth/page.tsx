"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/firebase-client"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function AuthLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // mark as logged in (localStorage + cookie for middleware)
      localStorage.setItem("nest_current_user", user.email || user.uid)
      
      // set cookie so Next.js middleware can detect session on the server
      try {
        document.cookie = `nest_current_user=${encodeURIComponent(user.email || user.uid)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
      } catch (e) {
        // ignore
      }
      
      setMessage("Login successful — redirecting...")
      setTimeout(() => router.push("/"), 600)
    } catch (error: any) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setMessage("Invalid email or password")
      } else if (error.code === "auth/invalid-email") {
        setMessage("Please enter a valid email address")
      } else {
        setMessage(error.message || "An error occurred during sign in")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center flex-col items-center">
          <Image src="/logo.png" alt="The Nest School" width={120} height={120} className="mb-4" />
          <div className="text-sm text-gray-600 font-semibold tracking-wide">
            The Nest School Admin Dashboard
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sign in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              placeholder="admin@nestschool.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {message && (
            <div className={`text-sm ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
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
