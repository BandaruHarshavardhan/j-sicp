"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isDemoFallback, setIsDemoFallback] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error("Failed to request password reset")
      }

      const data = await res.json()
      if (data.isDemoFallback) {
        setIsDemoFallback(true)
      }

      // Always show success to prevent email enumeration
      setSuccess(true)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 text-center">Reset Password</h2>
            <p className="mt-2 text-sm text-slate-500 text-center">Enter your email to receive a reset link</p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center space-y-4">
                {isDemoFallback ? (
                  <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="font-bold text-blue-900 mb-2">Demo Mode Active</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Email delivery is disabled for this demo account. Demo password reset is available for the configured demo account. Use the demo reset option.
                    </p>
                    <a
                      href="/api/auth/demo-reset-redirect"
                      className="inline-flex justify-center items-center py-2.5 px-4 w-full border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition"
                    >
                      Open Demo Reset
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Check your email</h3>
                    <p className="text-sm text-slate-500">
                      If an account exists for {email}, a password reset link has been sent. 
                      Please check your inbox (and spam folder).
                    </p>
                  </>
                )}
                <div className="pt-4">
                  <Link 
                    href="/auth/login"
                    className="inline-flex justify-center items-center py-2.5 px-4 border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition w-full"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                  {!isLoading && <ArrowRight size={16} className="ml-2" />}
                </button>

                <div className="mt-4 text-center">
                  <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
