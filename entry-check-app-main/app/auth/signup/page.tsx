"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/firebase-client"
import { createUserWithEmailAndPassword } from "firebase/auth"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email || !password) {
      setMessage("Please provide email and password")
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setMessage("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      setMessage("Account created successfully — redirecting to login...")
      setTimeout(() => router.push("/auth"), 800)
    } catch (error: any) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setMessage("This email is already in use")
      } else if (error.code === "auth/weak-password") {
        setMessage("Password should be at least 6 characters")
      } else if (error.code === "auth/invalid-email") {
        setMessage("Please enter a valid email address")
      } else {
        setMessage(error.message || "An error occurred during sign up")
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create account</h2>
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
          <div>
            <label className="block text-sm text-gray-600">Confirm password</label>
            <input 
              type="password" 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              className="mt-1 w-full px-3 py-2 border rounded-md" 
              required
            />
          </div>
          {message && (
            <div className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
            <Link href="/auth" className="text-sm text-gray-600 underline">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
