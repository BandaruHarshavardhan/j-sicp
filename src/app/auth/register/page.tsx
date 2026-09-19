"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Lock, Mail, User, Phone, Building2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "CITIZEN",
    organization: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push("/auth/login")
      } else {
        const data = await res.json()
        setError(data.message || "Registration failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const needsOrganization = formData.role === "INSTITUTION" || formData.role === "INDUSTRY"

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 text-center">Create an Account</h2>
            <p className="mt-2 text-sm text-slate-500 text-center">Join J-SICP to make an impact</p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors bg-white"
                >
                  <option value="CITIZEN">Citizen (Report Issues)</option>
                  <option value="INSTITUTION">Institution/University (Solve Challenges)</option>
                  <option value="INDUSTRY">Industry/CSR (Sponsor & Solve)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {needsOrganization && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      name="organization"
                      required={needsOrganization}
                      value={formData.organization}
                      onChange={handleChange}
                      className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                      placeholder="Organization Name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition mt-2"
              >
                {isLoading ? "Registering..." : "Create Account"}
                {!isLoading && <ArrowRight size={16} className="ml-2" />}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm">
              <span className="text-slate-500">Already have an account? </span>
              <Link href="/auth/login" className="font-medium text-secondary hover:text-accent transition">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
