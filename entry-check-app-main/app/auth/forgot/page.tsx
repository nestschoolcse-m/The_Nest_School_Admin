"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase-client"
import { sendPasswordResetEmail } from "firebase/auth"

export default function ForgotPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    if (!email) {
      setError("Please provide your email address")
      setLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setMessage("Password reset email sent! Please check your inbox.")
      setTimeout(() => router.push("/auth"), 3000)
    } catch (error: any) {
      console.error("Reset error:", error)
      if (error.code === "auth/user-not-found") {
        setError("No user found with this email address.")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError(error.message || "An error occurred while sending reset email.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-block">
          <div className="w-14 h-14 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold mx-auto">NS</div>
          <div className="text-sm text-gray-600 mt-2">The Nest School Admin Dashboard</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Reset password</h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
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
          
          {message && <div className="text-sm text-green-600">{message}</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-between pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <Link href="/auth" className="text-sm text-gray-600 underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
